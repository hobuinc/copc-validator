import { Check } from 'types'
import { Copc, Las } from 'copc'
import {
  basicCheck,
  checkVlrDuplicates,
  Statuses,
  vlrCheck,
} from '../../checks'

const vlrs: Check.Suite<Copc> = {
  vlrCount: (c) =>
    basicCheck(c.vlrs.filter((v) => !v.isExtended).length, c.header.vlrCount),
  evlrCount: (c) =>
    basicCheck(c.vlrs.filter((v) => v.isExtended).length, c.header.evlrCount),
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
