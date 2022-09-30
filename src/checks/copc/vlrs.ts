import { Statuses as CommonMsgs } from './common'
import { Check } from 'types'
import { Copc, Las } from 'copc'
import { basicCheck } from '../../checks'

const vlrs: Check.Suite<Copc> = {
  vlrCount: (c) =>
    basicCheck(c.vlrs.filter((v) => !v.isExtended).length, c.header.vlrCount),
  evlrCount: (c) =>
    basicCheck(c.vlrs.filter((v) => v.isExtended).length, c.header.evlrCount),
  'vlrs.copc-info': (c) => {
    const vlr = Las.Vlr.find(c.vlrs, 'copc', 1)
    if (!vlr) return Messages.requiredVlrNotFound
    if (checkVlrDuplicates(c.vlrs, 'copc', 1))
      return Messages.multipleCopcVlrsFound('copc-info')
    return basicCheck(vlr, (v) => !v.isExtended && v.contentLength === 160)
  },
  'vlrs.copc-hierarchy': (c) => {
    const vlr = Las.Vlr.find(c.vlrs, 'copc', 1000)
    if (!vlr) return Messages.requiredVlrNotFound
    if (checkVlrDuplicates(c.vlrs, 'copc', 1))
      return Messages.multipleCopcVlrsFound('copc-hierarchy')
    return { status: 'pass' }
  },
  'vlrs.laszip-encoded': (c) => {
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
  ...CommonMsgs,
  requiredVlrNotFound: {
    status: 'fail',
    info: 'Failed to find VLR',
  } as Check.Status,
  recommendedVlrNotFound: {
    status: 'warn',
    info: 'Failed to find VLR (Not required, but recommended)',
  } as Check.Status,
  multipleCopcVlrsFound: (name: string) =>
    ({
      status: 'fail',
      info: `Found multiple ${name} VLRs`,
    } as Check.Status),
}

const checkVlrDuplicates = (
  vlrs: Las.Vlr[],
  userId: string,
  recordId: number,
) => !!Las.Vlr.find(removeVlr(vlrs, userId, recordId), userId, recordId)

const removeVlr = (vlrs: Las.Vlr[], userId: string, recordId: number) => {
  const i = vlrs.findIndex(
    (v) => v.userId === userId && v.recordId === recordId,
  )
  return vlrs.slice(0, i).concat(vlrs.slice(i + 1))
}
