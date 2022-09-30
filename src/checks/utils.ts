import { Check, Function } from '../types'
import { flatMapDeep, map, flattenDeep } from 'lodash'

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
export const invokeAllChecks = async (
  suites: SuiteWithSource[],
): Promise<Check[]> => flattenDeep(await Promise.all([...innerMap(suites)]))

// I need to do further testing to ensure these functions are performance optimal

const innerMap = (suites: SuiteWithSource[]): Promise<Check[]>[] =>
  flatMapDeep(suites, ({ source, suite }) =>
    map(suite, (f, id) => checkPromise(source, f, id)),
  )

type SuiteWithSource<T = any> = { source: T; suite: Check.Suite<T> }

const checkPromise = async (
  source: unknown,
  f: Function<unknown>,
  id: string,
): Promise<Check[]> => {
  // I feel like awaiting on f here kills a lot of performance with the async checks,
  // but I need more testing to be sure. Maybe it has no affect and I've made this all
  // more complicated on myself than it needed to be ¯\_(ツ)_/¯
  const r = await f(source)
  if (Array.isArray(r)) return r
  return [{ id, ...r }]
  // Function.isNestedSuite(f) ? f(source) : [{id, ...(await f(source))}]
  // I was returning the above statement, but my isNestedSuite type guard
  // was not working effectively
}
