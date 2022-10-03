import { Check } from 'types'
import { Copc, Las } from 'copc'
import { basicCheck, Statuses } from '../../checks/utils'

const vlrs: Check.Suite<Copc> = {
  vlrCount: (c) =>
    basicCheck(c.vlrs.filter((v) => !v.isExtended).length, c.header.vlrCount),
  evlrCount: (c) =>
    basicCheck(c.vlrs.filter((v) => v.isExtended).length, c.header.evlrCount),
  'copc-info': (c) => {
    const vlr = Las.Vlr.find(c.vlrs, 'copc', 1)
    if (!vlr) return Messages.requiredVlrNotFound
    if (checkVlrDuplicates(c.vlrs, 'copc', 1))
      return Messages.multipleCopcVlrsFound('copc-info')
    return basicCheck(vlr, (v) => !v.isExtended && v.contentLength === 160)
  },
  'copc-hierarchy': (c) => {
    const vlr = Las.Vlr.find(c.vlrs, 'copc', 1000)
    if (!vlr) return Messages.requiredVlrNotFound
    if (checkVlrDuplicates(c.vlrs, 'copc', 1000))
      return Messages.multipleCopcVlrsFound('copc-hierarchy')
    return Statuses.success
  },
  'laszip-encoded': (c) => {
    const vlr = Las.Vlr.find(c.vlrs, 'laszip encoded', 22204)
    if (!vlr) return Messages.recommendedVlrNotFound
    return basicCheck(
      vlr,
      (v) => !v.isExtended && v.description === 'lazperf variant',
    )
  },
}

export default vlrs

const Messages = {
  // ...Statuses,
  requiredVlrNotFound: Statuses.failureWithInfo('Failed to find VLR'),
  recommendedVlrNotFound: Statuses.warningWithInfo(
    'Failed to find VLR (Not required, but recommended)',
  ),
  multipleCopcVlrsFound: (name: string) =>
    Statuses.failureWithInfo(`Found multiple ${name} VLRs`),
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
