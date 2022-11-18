import { Binary, Getter, Las } from 'copc'
import { Check } from '../types/index.js'
import {
  basicCheck,
  vlrCheck,
  Statuses,
  checkVlrDuplicates,
} from '../utils/index.js'
import proj4 from '@landrush/proj4'

/**
 * Suite of Check Function for checking the VLRs retrieved by `Copc.create` or
 * `Las.Vlr.walk`. Also requires the `Las.Vlr.OffsetInfo` from `copc.header` to
 * confirm `vlrCount` and `evlrCount`. Used in the Copc Suite and the Las and
 * Fallback Collections, in case `Las.Vlr.walk` succeeds after `Copc.create` fails
 */
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
        /*const p = */ proj4(wkt)
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
