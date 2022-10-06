import { basicCheck, vlrCheck } from '../../checks'
import { Las } from 'copc'
import { Check } from 'types'

export const vlrs: Check.Suite<{ header: Las.Header; vlrs: Las.Vlr[] }> = {
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
