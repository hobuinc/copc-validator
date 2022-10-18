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

// Cleaner output than basicCheck since undefined `info` does not get added to
// the resulting object, plus allows for warnings and differing info messages
// based on the check status
export const complexCheck = <T>(
  source: T,
  checker: T | T[] | ((s: T) => boolean),
  warning = false,
  infoOnFailure?: string,
  infoOnSuccess?: string,
): Check.Status => {
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

// I need to do further testing to ensure the above function is performance optimal

export const invokeCollection = async (
  collection: Promise<Check.Suite.Collection> | Check.Suite.Collection,
): Promise<Check[]> =>
  (
    await PromisePool.for(await collection)
      .withConcurrency(200)
      .process(async (suiteWSource) => {
        const { suite, source } = await suiteWSource
        return Object.entries(suite).map(([id, f]) =>
          performCheck(source, f, id),
        )
      })
  ).results.flat()

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

// ========== check/vlrs.ts UTILITIES ==========

/**
 * Utility function that takes care of basic VLR checking such as 'does it exist'
 * and 'does only one exist', with simple options to expand the check a bit
 * @param vlrs `Las.Vlr[]` from `Copc.create()` or `Las.Vlr.walk()`
 * @param userId ASPRS-registered userId for VLR issuer
 * @param recordId Record number indicating VLR type
 * @param required Indicates whether VLR is required (fail if missing), or just
 * recommended (warn if missing)
 * @param finalCheck Function that takes a `Las.Vlr` object and returns a boolean,
 * used to perform additional check(s) on the specified VLR (if found)
 * @param info Optional info string to include with the `finalCheck` output
 * @returns {Check.Status} A single `Check.Status` object
 */
export const vlrCheck = (
  vlrs: Las.Vlr[],
  userId: string,
  recordId: number,
  required: boolean = true,
  finalCheck?: (vlr: Las.Vlr) => boolean,
  info?: string,
): Check.Status => {
  const vlrName = `${userId}-${recordId}`
  const vlr = Las.Vlr.find(vlrs, userId, recordId)
  if (!vlr)
    return required
      ? Statuses.failureWithInfo(`Failed to find VLR: ${vlrName}`)
      : Statuses.warningWithInfo(`Failed to find recommended VLR: ${vlrName}`)
  if (checkVlrDuplicates(vlrs, userId, recordId))
    return Statuses.failureWithInfo(`Found multiple ${vlrName} VLRs`)
  return finalCheck ? basicCheck(vlr, finalCheck, info) : Statuses.success
}

/**
 * Utility to check for duplicates of a given VLR in the `Copc.create()` vlrs
 * array of `Las.Vlr` objects
 * @param vlrs `Las.Vlr[]` from `Copc.create()`
 * @param userId ASPRS-registered userId for the VLR issuer
 * @param recordId Record number indicating the VLR type
 * @returns A boolean representing if the `Las.Vlr[]` contains two VLRs that
 * match the given `userId` & `recordId`
 */
export const checkVlrDuplicates = (
  vlrs: Las.Vlr[],
  userId: string,
  recordId: number,
) => !!Las.Vlr.find(removeVlr(vlrs, userId, recordId), userId, recordId)

export const removeVlr = (vlrs: Las.Vlr[], userId: string, recordId: number) =>
  ((i: number) => vlrs.slice(0, i).concat(vlrs.slice(i + 1)))(
    vlrs.findIndex((v) => v.userId === userId && v.recordId === recordId),
  )

// ========== check/util.ts UTILITIES ==========
const performCheck = (
  source: unknown,
  f: Check.Function<unknown>,
  id: string,
): Check => {
  let result: Check.Status
  // console.time(id)
  try {
    result = f(source)
  } catch (e) {
    result = { status: 'fail', info: (e as Error).message }
  }
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
