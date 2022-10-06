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
  // Getter.create() should never throw error outside of 'bad string'
  try {
    const get = Getter.create(source)
    try {
      // Attempt Copc.create()
      const copc = await Copc.create(get)
      // Copc.create() can fail for the following reasons:
      //   - Las.Header.parse() throws an error (see below 55)
      //   - Las.Vlr.walk() throws an error (see below 61)
      //   - copc info VLR is missing
      //   - Corrupt/bad binary data

      // Copc.create() passed, probably valid COPC
      // need to perform additional checks to confirm (copcSuite)

      const checks = await invokeAllChecks({
        source: get,
        suite: copcSuite,
      })

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
    } catch (copcError) {
      // Copc.create() failed, definitely not valid COPC...
      // Check file with Las functions to determine why Copc.create() failed
      try {
        // attempt Las parse inside try { } to fail out *before* attempting
        // invokeAllChecks() since LasSuite relys on `header` and `vlrs`
        const header = Las.Header.parse(
          await get(0, Las.Constants.minHeaderLength),
        )
        // Las.Header.parse() can fail for the following reasons:
        //   - buffer.byteLength < minHeaderLength (375)
        //   - fileSignature (first 4 bytes) !== 'LASF'
        //   - majorVersion !== 1 || minorVersion !== 2 | 4
        //   - Corrupt/bad binary data
        const vlrs = await Las.Vlr.walk(get, header)
        // Las.Vlr.walk() can fail for the following reasons:
        //   - vlrHeaderLength !== 54
        //   - evlrHeaderLength !== 60
        //   - Corrupt/bad binary data
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
          copcError: copcError as Error,
        }
      } catch (lasError) {
        // Las.* functions failed, try poking around manually with the Getter
        // to determine why Las failed to initialize (getterSuite)
        const checks = await invokeAllChecks({
          source: get,
          suite: getterSuite,
        })
        const errors: { error: Error; copcError?: Error } = (() => {
          const same = lasError === copcError
          if (same) return { error: copcError as Error }
          return {
            error: lasError as Error,
            copcError: copcError as Error,
          }
        })()
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
          checks,
          ...errors,
          // error: copcError as Error,
          // copcError: lasError as Error,
        }
      }
    }
  } catch (getterError) {
    throw getterError
  }
}

// .some() should be more optimal than .every() in this case, but could be double-checked
const resultFromChecks = (checks: Check[]): 'valid' | 'invalid' =>
  checks.some((check) => check.status === 'fail') ? 'invalid' : 'valid'
