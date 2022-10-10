// This suite can be shared between all three master suites (copc, las, getter)
import { basicCheck, Statuses } from '.'
import { Las } from 'copc'
import { Check } from 'types'

export const vlrs: Check.Suite<{
  header: Las.Vlr.OffsetInfo
  vlrs: Las.Vlr[]
}> = {
  vlrCount: ({ header, vlrs }) =>
    basicCheck(vlrs.filter((v) => !v.isExtended).length, header.vlrCount),
  evlrCount: ({ header, vlrs }) =>
    basicCheck(vlrs.filter((v) => v.isExtended).length, header.evlrCount),
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

export default vlrs

export const vlrCheck = (
  vlrs: Las.Vlr[],
  userId: string,
  recordId: number,
  required: boolean = true,
  finalCheck?: (vlr: Las.Vlr) => boolean,
  info?: unknown,
) => {
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
