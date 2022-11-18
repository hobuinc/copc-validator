import { Check } from 'types'
import { Statuses } from './status.js'

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
