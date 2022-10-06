import { invokeAllChecks } from '../checks'
import { Copc, Getter, Las } from 'copc'
import { Check, Report } from 'types'

export const generateReport = async (
  source: string,
  copcSuite: Check.Suite<Getter>,
  lasSuite: Check.Suite<Getter>,
  getterSuite: Check.Suite<Getter>,
  { name, type }: Report.Options,
): Promise<Report> => {
  const start = new Date()
  const startTime = performance.now()
  const get = Getter.create(source)
  try {
    try {
      // Attempt Copc.create()
      const copc = await Copc.create(get)
      // Copc.create() passed, probably valid COPC
      // need to perform additional checks to confirm

      const checks = await invokeAllChecks({
        source: get,
        suite: copcSuite,
      })
      // const checks = await invokeAllChecks([
      //   { source: copc, suite: copcSuite },
      //   { source: { get, copc }, suite: hierarchySuite },
      // ])

      return {
        name,
        scan: {
          type,
          filetype: 'COPC',
          result: resultFromChecks(checks),
          start,
          end: new Date(),
          time: performance.now() - startTime,
        },
        checks,
        copc,
      }
    } catch (failedCopc) {
      // Copc.create() failed, definitely not COPC...
      // Check file with Las functions to determine why Copc.create() failed
      try {
        const header = Las.Header.parse(
          await get(0, Las.Constants.minHeaderLength),
        )
        const vlrs = await Las.Vlr.walk(get, header)
        const checks = await invokeAllChecks({ source: get, suite: lasSuite })
        return {
          name,
          scan: {
            type,
            filetype: 'LAS',
            result: resultFromChecks(checks), //'NA',
            start,
            end: new Date(),
            time: performance.now() - startTime,
          },
          checks,
          las: {
            header,
            vlrs,
          },
          copcError: failedCopc as Error,
        }
      } catch (e) {
        // Las.* functions failed, can fallback on failedGetter catch (?)
        throw e
      }
    }
  } catch (failedGetter) {
    // Getter.create() failed, error with source string
    return {
      name,
      scan: {
        type,
        filetype: 'Unknown',
        result: 'NA',
        start,
        end: new Date(),
        time: performance.now() - startTime,
      },
      checks: [],
      error: failedGetter as Error,
    }
  }
}

// .some() should be more optimal than .every() in this case, but could be double-checked
const resultFromChecks = (checks: Check[]): 'valid' | 'invalid' =>
  checks.some((check) => check.status === 'fail') ? 'invalid' : 'valid'
