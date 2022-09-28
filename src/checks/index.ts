import { Check } from 'types'
import { map, flatMapDeep } from 'lodash'

export * from './copc'
export * from './las'

/**
 * Utility function to invoke multiple test Suites at once and combine them
 * into one `Check` array. Supply a Suite with it's common source in this
 * type of object:
 * ```{
 * source: T,
 * suite: Check.Suite<T>
 * }```
 * @param {<T>{source: T, suite: Check.Suite<T>}[]} suites - Array of objects
 * containing a Check Suite and the source to run the checks against
 * @returns {Promise<Check[]>} A single Promise object containing the array
 * of all check `id`s and `status`es (`Check` objects)
 */
export const invokeAllChecks = (suites: SuiteWithSource[]): Promise<Check[]> =>
  Promise.all(flatMapDeep(suites, (s) => innerMap(s)))
const innerMap = ({ source, suite }: SuiteWithSource): Promise<Check>[] =>
  map(suite, (f, id) => checkPromise(f(source), id))

type SuiteWithSource<T = any> = { source: T; suite: Check.Suite<T> }

const checkPromise = async (
  s: Check.Status | Promise<Check.Status>,
  id: string,
): Promise<Check> => ({ id, ...(await s) })

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
  info?: any,
): Check.Status => {
  return { status: booleanFn(checker)(source) ? 'pass' : 'fail', info }
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
