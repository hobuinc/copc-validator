import { basicCheck, vlrCheck } from 'checks'
import { Las } from 'copc'
import { Check } from 'types'

// This suite can be shared between all three master suites (copc, las, getter)

// Was originally `src/checks/las/vlrs.ts` but I realized it could work on each report branch
export const vlrs: Check.Suite<{
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

export default vlrs
