import { invokeAllChecks } from '../checks'
import { Copc, Getter } from 'copc'
import { Check, Report } from 'types'
import {
  enhancedHierarchyNodes,
  EnhanchedHierarchyParams,
  HierarchyCheckParams,
  NodePoint,
} from '../checks/copc/common'
import { map } from 'lodash'

export const generateReport = async (
  source: string,
  copcSuite: Check.Suite<Copc>,
  hierarchySuite: Check.Suite<HierarchyCheckParams>,
  options: Report.Options,
): Promise<Report> => {
  const start = new Date()
  const startTime = performance.now()
  const { name, type } = options
  try {
    const get = Getter.create(source)
    try {
      // Attempt Copc.create()
      const copc = await Copc.create(get)
      // Copc.create() passed, probably valid COPC
      // need to perform additional checks to confirm

      // should combine all sync and async check functions into one array and
      // invoke all tests before awaiting on any checks

      // this should be pretty close to what I'm intending to do, needs further testing
      const checks = await invokeAllChecks([
        { source: copc, suite: copcSuite },
        { source: { get, copc }, suite: hierarchySuite },
      ])

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
        error: failedCopc as Error,
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
