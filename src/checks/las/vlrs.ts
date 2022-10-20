import { basicCheck, Statuses } from 'checks'
import { Las } from 'copc'
import { Check } from 'types'

// This suite can be shared between all three master suites (copc, las, getter)

// Was originally `src/checks/las/vlrs.ts` but I realized it could work on each report branch
export const vlrSuite: Check.Suite<{
  header: Las.Vlr.OffsetInfo
  vlrs: Las.Vlr[]
}> = {
  vlrCount: ({ header: { vlrCount }, vlrs }) =>
    basicCheck(vlrs.filter((v) => !v.isExtended).length, vlrCount),
  evlrCount: ({ header: { evlrCount }, vlrs }) =>
    basicCheck(vlrs.filter((v) => v.isExtended).length, evlrCount),
  'copc-info': ({ vlrs }) =>
    vlrCheck(
      vlrs,
      'copc',
      1,
      true,
      (v) => !v.isExtended && v.contentLength === 160,
    ),
  'copc-hierarchy': ({ vlrs }) => vlrCheck(vlrs, 'copc', 1000),
  'laszip-encoded': ({ vlrs }) =>
    vlrCheck(vlrs, 'laszip encoded', 22204, false, (v) => !v.isExtended),
}

export default vlrSuite

// ========== UTILITIES ==========
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
