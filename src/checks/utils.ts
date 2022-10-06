import { Check } from '../types'
import { flatMapDeep, map, flattenDeep } from 'lodash'

type SuiteWithSource<T = any> = { source: T; suite: Check.Suite<T> }
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
    ? flattenDeep(
        await Promise.all(
          flatMapDeep(suites, ({ source, suite }) =>
            map(suite, (f, id) => checkPromise(source, f, id)),
          ),
        ),
      )
    : flattenDeep(
        await Promise.all(
          map(suites.suite, (f, id) => checkPromise(suites.source, f, id)),
        ),
      )

// I need to do further testing to ensure the above function is performance optimal

const checkPromise = async (
  source: unknown,
  f: Check.Function<unknown>,
  id: string,
): Promise<Check[]> => {
  // I feel like awaiting on f() here kills a lot of performance with the async checks,
  // but I need more testing to be sure. Maybe it has no affect and I've made this all
  // more complicated on myself than it needed to be ¯\_(ツ)_/¯
  try {
    const r = await f(source)
    if (Array.isArray(r)) return r
    return [{ id, ...r }]
  } catch (e) {
    return [{ id, status: 'fail', info: e }]
  }
}
// Function.isNestedSuite(f) ? f(source) : [{id, ...(await f(source))}]
// I was returning the above statement, but my isNestedSuite type guard
// was not working effectively

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
  info?: unknown,
): Check.Status => ({
  status: booleanFn(checker)(source) ? 'pass' : 'fail',
  info,
})

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

export const Statuses = {
  moreInfoOnFullScan: 'Run a Full Scan for more information',
  success: { status: 'pass' } as Check.Status,
  failure: { status: 'fail' } as Check.Status,
  successWithInfo: (info: any) => ({ status: 'pass', info } as Check.Status),
  failureWithInfo: (info: any) => ({ status: 'fail', info } as Check.Status),
  warningWithInfo: (info: any) => ({ status: 'warn', info } as Check.Status),
}

export const findCheck = (checks: Check[], id: string) =>
  checks.find((c) => c.id === id)
