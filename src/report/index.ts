import { invokeAllChecks } from '../checks'
import { Binary, Copc, Getter, Las } from 'copc'
import { map } from 'lodash'
import { Check, Report } from 'types'

const checkFromStatus = (s: Check.Status, id: string): Check => {
  return { id, ...s }
}
export const generateReport = async (
  source: string,
  copcSuite: Check.Suite<Copc>,
  hierarchySuite: Check.Suite<{ get: Getter; copc: Copc }>,
  options: Report.Options,
): Promise<Report> => {
  const start = new Date()
  const { name, type } = options
  try {
    const get = Getter.create(source)
    try {
      // Attempt Copc.create()
      const copc = await Copc.create(get)
      // Copc.create() passed, probably valid COPC
      // need to perform additional checks to confirm
      // const copcChecks: Check[] = await Promise.all(
      //   map(copcSuite, async (f, id) => checkFromStatus(await f(copc), id)),
      // )
      // const hierarchyChecks: Check[] = await Promise.all(
      //   map(hierarchySuite, async (f, id) =>
      //     checkFromStatus(await f({ get, copc }), id),
      //   ),
      // )
      // should combine all sync and async check functions into one array and
      // invoke all tests before awaiting on any checks

      // will combine suites before `await Promise.all()` once multiple suites
      // are properly implemented, using this for now:
      // const checks = [...copcChecks, ...hierarchyChecks]

      const oldStart = performance.now()
      const checks = await invokeAllChecks([
        { source: copc, suite: copcSuite },
        { source: { get, copc }, suite: hierarchySuite },
      ])
      const oldEnd = performance.now()
      //       const newStart = performance.now()
      //       const newChecks = await invokeAllChecksV2([
      //         { source: copc, suite: copcSuite },
      //         { source: { get, copc }, suite: hierarchySuite },
      //       ])
      //       const newEnd = performance.now()
      //       console.log(`Old performance: ${oldEnd - oldStart}ms
      // New performance: ${newEnd - newStart}ms`)

      return {
        name,
        scan: {
          type,
          result: 'COPC',
          start,
          end: new Date(),
        },
        checks,
        copc,
      }
    } catch (failedCopc) {
      // Copc.create() failed, definitely not COPC...
      return {
        name,
        scan: {
          type,
          result: 'Unknown',
          start,
          end: new Date(),
        },
        checks: [],
        error: failedCopc as Error,
      }
    }
  } catch (failedGetter) {
    // Getter.create() failed, error with source string
    return {
      name,
      scan: {
        type,
        result: 'Unknown',
        start,
        end: new Date(),
      },
      checks: [],
      error: failedGetter as Error,
    }
  }
}
