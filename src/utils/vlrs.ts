import { Las } from 'copc'
import { Check } from '../types/index.js'
import { complexCheck } from './checks.js'
import { Statuses } from './status.js'

type vlrCheck = {
  vlrs: Las.Vlr[]
  userId: string
  recordId: number
  required?: boolean
  finalCheck?: (vlr: Las.Vlr) => boolean
  infoOnFailure?: string
  infoOnSuccess?: string
}
/**
 * Utility function that takes care of basic VLR checking such as 'does it exist'
 * and 'does only one exist', with simple options to expand the check a bit
 * @param {vlrCheck} p - Parameter object
 * @param p.vlrs - `Las.Vlr[]` from `Copc.create()` or `Las.Vlr.walk()`
 * @param p.userId - ASPRS-registered userId for VLR issuer
 * @param p.recordId - Record number indicating VLR type
 * @param p.required - Indicates whether VLR is required (fail if missing), or just
 * recommended (warn if missing) - Default: `true`
 * @param p.finalCheck - Function that takes a `Las.Vlr` object and returns a boolean,
 * used to perform additional check(s) on the specified VLR (if found)
 * @param p.infoOnFailure - Optional string to include with Status is failed
 * @param p.infoOnSuccess - Optional string to include with Status if passed
 * @returns - A single `Check.Status` object
 */
/* eslint-disable-next-line */
export const vlrCheck = ({
  vlrs,
  userId,
  recordId,
  required = true,
  finalCheck,
  infoOnFailure,
  infoOnSuccess,
}: vlrCheck): Check.Status => {
  const vlrName = `${userId}-${recordId}`
  const vlr = Las.Vlr.find(vlrs, userId, recordId)
  if (!vlr)
    return required
      ? Statuses.failureWithInfo(`Failed to find VLR: ${vlrName}`)
      : Statuses.warningWithInfo(`Failed to find recommended VLR: ${vlrName}`)
  if (checkVlrDuplicates(vlrs, userId, recordId))
    return Statuses.warningWithInfo(`Found multiple ${vlrName} VLRs`)
  return finalCheck
    ? complexCheck({
        source: vlr,
        checker: finalCheck,
        infoOnFailure,
        infoOnSuccess,
      })
    : Statuses.success //basicCheck(vlr, finalCheck, info) : Statuses.success
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
