import { Check } from 'types'
import { flatMapDeep, map } from 'lodash'
import { Las } from 'copc'
import { PromisePool } from '@supercharge/promise-pool'

// ========== CHECK WRITING ==========
export const Statuses = {
  moreInfoOnFullScan: 'Run a Full Scan for more information',
  success: { status: 'pass' } as Check.Status,
  failure: { status: 'fail' } as Check.Status,
  successWithInfo: (info: string) => ({ status: 'pass', info } as Check.Status),
  failureWithInfo: (info: string) => ({ status: 'fail', info } as Check.Status),
  warningWithInfo: (info: string) => ({ status: 'warn', info } as Check.Status),
}
type SuiteWithSource = Check.Suite.withSource<any>

/**
 * Utility function to convert simple boolean logic and basic functions
 * into `Check.Status` objects for `Check.Function` output.
 *
 * @param source The variable to check
 * @param checker The function to check against. If provided with a constant or
 * array of constants, `basicCheck` will use `===` or `Array.includes()` as the
 * checker function
 * @param info Optional info to include with the output
 * @returns {Check.Status} `Check.Status` object: `{status: 'pass'|'fail'|'warn', info?: any}`
 */
export const basicCheck = <T>(
  source: T,
  checker: T | T[] | ((s: T) => boolean),
  info?: string,
): Check.Status => ({
  status: booleanFn(checker)(source) ? 'pass' : 'fail',
  info,
})

type complexParams<T> = {
  source: T
  checker: T | T[] | ((s: T) => boolean)
  warning?: boolean
  infoOnFailure?: string
  infoOnSuccess?: string
}
// Cleaner output than basicCheck since undefined `info` does not get added to
// the resulting object, plus allows for warnings and differing info messages
// based on the check status
export const complexCheck = <T>({
  source,
  checker,
  warning = false,
  infoOnFailure,
  infoOnSuccess,
}: complexParams<T>): Check.Status => {
  if (booleanFn(checker)(source))
    return infoOnSuccess
      ? Statuses.successWithInfo(infoOnSuccess)
      : Statuses.success
  if (warning)
    return infoOnFailure
      ? Statuses.warningWithInfo(infoOnFailure)
      : Statuses.warningWithInfo('No information provided')
  return infoOnFailure
    ? Statuses.failureWithInfo(infoOnFailure)
    : Statuses.failure
}
// ========== CHECK CALLING ==========
/**
 * Utility function to invoke multiple test Suites at once and combine them
 * into one `Check` array. Supply a Suite with it's common source in this
 * type of object:
 * ```{
 * source: T,
 * suite: Check.Suite<T>
 * }```
 *
 * Can also supply a single object (like above) and `invokeAllChecks` will
 * be able to skip a `flatMapDeep` call, which should be more performant
 * @param {<T>{source: T, suite: Check.Suite<T>}[]} suites - Array of objects
 * containing a Check Suite and the source to run the checks against
 * @returns {Promise<Check[]>} A single Promise object containing the array
 * of all check `id`s and `status`es (`Check` objects)
 */
export const invokeAllChecks = async (
  suites: SuiteWithSource | SuiteWithSource[],
): Promise<Check[]> =>
  Array.isArray(suites)
    ? (
        await Promise.all(
          flatMapDeep(
            suites,
            ({ source, suite }) =>
              map(suite, (f, id) => performCheck(source, f, id)), //checkPromise(source, f, id)),
          ),
        )
      ).flat()
    : (
        await Promise.all(
          map(suites.suite, (f, id) => performCheck(suites.source, f, id)), //checkPromise(suites.source, f, id)),
        )
      ).flat()

/**
 * Utility to replace invokeAllChecks within generateReport() for more optimal
 * performance. Minimizes `await`ing between Check.Functions and Check.Suites
 * by throwing each into a Promise Pool
 * @param collection Array of `Check.Suite.withSource` objects (or Promises)
 * @returns Promise<Check[]> Array of all Checks completed
 */
export const invokeCollection = async (
  collection: Promise<Check.Suite.Collection> | Check.Suite.Collection,
): Promise<Check[]> =>
  Promise.all(
    (
      await PromisePool.for(await collection)
        .withConcurrency(200)
        .process(async (suiteWSource, i) => {
          try {
            const { suite, source } = await suiteWSource
            return Object.entries(suite).map(([id, f]) =>
              performCheck(source, f, id),
            )
          } catch (error) {
            return {
              id: `Sourcer ${i}: Failed to read source`,
              status: 'fail',
              info: (error as Error).message,
            } as Check
          }
        })
    ).results.flat(),
  )

// I need to do further testing to ensure the above functions are performance optimal

// ========== check/util.ts UTILITIES ==========
const performCheck = async (
  source: unknown,
  f: Check.Function<unknown>,
  id: string,
): Promise<Check> => {
  // console.time(id)
  // let result: Check.Status
  // try {
  //   result = f(source)
  // } catch (e) {
  //   result = { status: 'fail', info: (e as Error).message }
  // }
  const result: Check.Status = await (() => {
    try {
      return f(source)
    } catch (e) {
      return { status: 'fail', info: (e as Error).message }
    }
  })()
  // console.timeEnd(id)
  return { id, ...result }
}

const booleanFn = <T>(check: T | T[] | ((v: T) => boolean)) => {
  if (Array.isArray(check)) return arrayCheck(check)
  else if (check instanceof Function) return check
  return constCheck(check)
}

const constCheck =
  <T>(constant: T) =>
  (variable: T) =>
    variable === constant

const arrayCheck =
  <T>(array: T[]) =>
  (variable: T) =>
    array.includes(variable)
// ========== CHECK TESTING ==========
export const findCheck = (checks: Check[], id: string) =>
  checks.find((c) => c.id === id)

export const splitChecks = (
  checks: Check[],
  isValid: (c: Check) => boolean = (c) => c.status === 'pass',
): [Check[], Check[]] =>
  checks.reduce<[Check[], Check[]]>(
    ([pass, fail], check) =>
      isValid(check) ? [[...pass, check], fail] : [pass, [...fail, check]],
    [[], []],
  )

export const getCheckIds = (checks: Check[]): string[] =>
  checks.reduce<string[]>((prev, curr) => [...prev, curr.id], [])
