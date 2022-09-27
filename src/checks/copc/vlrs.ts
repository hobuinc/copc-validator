import { Messages as CommonMsgs } from './common'
import { Check } from 'types'
import { Las } from 'copc'

const vlrs: Check.SyncGroup = {
  'vlrCount match': (c) =>
    c.vlrs.filter((v) => !v.isExtended).length === c.header.vlrCount,
  'evlrCount match': (c) =>
    c.vlrs.filter((v) => v.isExtended).length === c.header.evlrCount,
  'vlrs.copc-info': (c) => {
    const v = Las.Vlr.find(c.vlrs, 'copc', 1)
    if (!v) return { status: 'fail', info: Messages.requiredVlrNotFound }
    return !v.isExtended && v.contentLength === 160
  },
  'vlrs.copc-hierarchy': (c) => {
    const v = Las.Vlr.find(c.vlrs, 'copc', 1000)
    if (!v) return { status: 'fail', info: Messages.requiredVlrNotFound }
    return { status: 'pass', info: Messages.moreInfoOnFullScan }
  },
  'vlrs.laszip-encoded': (c) => {
    const v = Las.Vlr.find(c.vlrs, 'laszip encoded', 22204)
    if (!v) return { status: 'warn', info: Messages.recommendedVlrNotFound }
    return !v.isExtended && v.description === 'lazperf variant'
  },
}

export default vlrs

const Messages = {
  ...CommonMsgs,
  requiredVlrNotFound: 'Failed to find VLR',
  recommendedVlrNotFound: 'Failed to find VLR (Not required, but recommended)',
}
