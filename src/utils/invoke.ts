import { Check } from 'types'
import map from 'lodash.map'
import flatMapDeep from 'lodash.flatmapdeep'

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
              map(suite, ({ function: f, description }, id) =>
                performCheck(source, f, id, description),
              ), //checkPromise(source, f, id)),
          ),
        )
      ).flat()
    : (
        await Promise.all(
          map(suites.suite, ({ function: f, description }, id) =>
            performCheck(suites.source, f, id, description),
          ), //checkPromise(suites.source, f, id)),
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
      await Promise.all(
        (
          await collection
        ).flatMap(async (suiteWSource, i) => {
          try {
            const { suite, source } = await suiteWSource
            const suiteChecks = Object.entries(suite).map(
              ([id, { function: f, description }]) =>
                performCheck(source, f, id, description),
            )
            return suiteChecks
          } catch (error) {
            return [
              {
                id: `Parser ${i}: Failed to read source`,
                status: 'fail',
                info: (error as Error).message,
              },
            ] as Check[]
          }
        }),
      )
    ).flat(),
  )
// I need to do further testing to ensure the above functions are performance optimal

const performCheck = async (
  source: unknown,
  f: Check.Function<unknown>,
  id: string,
  description: string,
): Promise<Check> => {
  // console.log(`Performing ${id}...`)
  // console.time(id)
  const result: Check.Status = await (() => {
    try {
      return f(source)
    } catch (e) {
      return { status: 'fail', info: (e as Error).message }
    }
  })()
  // console.timeEnd(id)
  return { id, description, ...result }
}

// eslint-disable-next-line
type SuiteWithSource = Check.Suite.withSource<any>
