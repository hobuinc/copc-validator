import { Binary, Getter, Las } from 'copc'
import { Check } from 'types'
import { basicCheck, vlrCheck, Statuses, checkVlrDuplicates } from 'utils'
import proj4 from '@landrush/proj4'

export const vlrSuite: Check.Suite<{
  header: Las.Vlr.OffsetInfo
  vlrs: Las.Vlr[]
}> = {
  vlrCount: ({ header: { vlrCount }, vlrs }) =>
    basicCheck(vlrs.filter((v) => !v.isExtended).length, vlrCount),
  evlrCount: ({ header: { evlrCount }, vlrs }) =>
    basicCheck(vlrs.filter((v) => v.isExtended).length, evlrCount),
  'copc-info': ({ vlrs }) =>
    vlrCheck({
      vlrs,
      userId: 'copc',
      recordId: 1,
      required: true,
      finalCheck: (v) =>
        !v.isExtended && v.contentLength === 160 && v.contentOffset === 429,
    }),
  'copc-hierarchy': ({ vlrs }) =>
    vlrCheck({ vlrs, userId: 'copc', recordId: 1000 }),
  'laszip-encoded': ({ vlrs }) =>
    vlrCheck({
      vlrs,
      userId: 'laszip encoded',
      recordId: 22204,
      required: false,
      finalCheck: (v) => !v.isExtended,
    }),
}

export default vlrSuite

export const manualVlrSuite: Check.Suite<{ get: Getter; vlrs: Las.Vlr[] }> = {
  wkt: async ({ get, vlrs }) => {
    const vlr = Las.Vlr.find(vlrs, 'LASF_Projection', 2112)
    if (!vlr) return Statuses.failureWithInfo(`Failed to find WKT SRS VLR`)
    if (checkVlrDuplicates(vlrs, 'LASF_Projection', 2112))
      return Statuses.failureWithInfo('Found multiple WKT SRS VLRs')
    const wkt = Binary.toCString(await Las.Vlr.fetch(get, vlr))
    const status = (() => {
      try {
        const p = proj4(wkt)
        //console.log(p)
        return Statuses.success
      } catch (error) {
        return Statuses.failureWithInfo(
          `Unable to initialize proj4 with WKT string`,
        )
      }
    })()
    return status
  },
  // 'copc-info-first': async ({get, vlrs}) => {
  //   const
  // }
}
