import { invokeAllChecks } from '../checks'
import { Copc, Getter } from 'copc'
import { Check, Report } from 'types'
import {
  enhancedHierarchyNodes,
  EnhanchedHierarchyParams,
  HierarchyCheckParams,
} from 'checks/copc/common'

export const generateReport = async (
  source: string,
  copcSuite: Check.Suite<Copc>,
  hierarchySuite: Check.Suite<HierarchyCheckParams>,
  postHierarchySuite: Check.Suite<EnhanchedHierarchyParams>,
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

      // should combine all sync and async check functions into one array and
      // invoke all tests before awaiting on any checks

      // this should be pretty close to what I'm intending to do, needs further testing
      const preChecks = await invokeAllChecks([
        { source: copc, suite: copcSuite },
        { source: { get, copc }, suite: hierarchySuite },
      ])

      // this part is non-optimal, I should find a better way to pass Check.Suites
      // into each other (to share a common source, limiting http or fs calls)
      const pd: enhancedHierarchyNodes = (
        preChecks.find((c) => c.id === 'enhancedHierarchy')!.info as {
          enhancedHierarchy: enhancedHierarchyNodes
        }
      ).enhancedHierarchy
      const postChecks = await invokeAllChecks([
        { source: { copc, pd }, suite: postHierarchySuite },
      ])

      const checks = preChecks.concat(postChecks)
      return {
        name,
        scan: {
          type,
          filetype: 'COPC',
          result: resultFromChecks(checks),
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
          filetype: 'Unknown',
          result: 'NA',
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
        filetype: 'Unknown',
        result: 'NA',
        start,
        end: new Date(),
      },
      checks: [],
      error: failedGetter as Error,
    }
  }
}

const resultFromChecks = (checks: Check[]): 'valid' | 'invalid' =>
  checks.some((check) => check.status === 'fail') ? 'invalid' : 'valid'
