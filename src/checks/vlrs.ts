import { Vlr } from 'copc/lib/las'
import { Check } from 'types'
import { checkFn, checkGenerator, Messages as CommonMsgs } from './common'
import { find, map, omit } from 'lodash'

const Messages = {
  ...CommonMsgs,
  requiredVlrNotFound: 'Failed to find VLR',
  recommendedVlrNotFound: 'Failed to find VLR (Not required, but recommended)',
}

type vlrCheck = checkFn<Vlr | undefined> & {
  userId: string
  recordId: number
}
type VlrChecksDictionary = {
  generate: checkGenerator
  [x: string]: vlrCheck | checkGenerator
}

const vlrs: VlrChecksDictionary = {
  'copc-info': {
    id: 10,
    userId: 'copc',
    recordId: 1,
    f: (v) => {
      if (!v) return { status: 'fail', info: Messages.requiredVlrNotFound }
      return !v.isExtended && v.contentLength === 160
    },
  },
  'copc-hierarchy': {
    id: 11,
    userId: 'copc',
    recordId: 1000,
    f: (v) => {
      if (!v) return { status: 'fail', info: Messages.requiredVlrNotFound }
      return {
        status: 'pass',
        info: Messages.moreInfoOnFullScan,
      }
    },
  },
  'laszip encoded': {
    id: 12,
    userId: 'laszip encoded',
    recordId: 22204,
    f: (v) => {
      if (!v) return { status: 'warn', info: Messages.recommendedVlrNotFound }
      return !v.isExtended
    },
  },
  generate: (c, checks, section) =>
    map(omit(checks, 'generate'), (details, vlrName) => {
      const { f, id, userId, recordId } = details as vlrCheck
      const vlr = find(c.vlrs, { userId, recordId })
      const result = f(vlr)
      const name = `${section}.${vlrName} check`
      if (typeof result === 'boolean')
        return { id, name, status: result ? 'pass' : 'fail' }
      const { status, info } = result
      return { id, name, status, info }
    }),
}

export default vlrs
