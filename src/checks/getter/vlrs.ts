import { Binary, Getter, Las } from 'copc'
import { Check } from 'types'
import vlrSuite, { checkVlrDuplicates } from 'checks/las/vlrs'
import { getterToHeader } from '.'
import { Statuses } from 'checks'
import proj4 from '@landrush/proj4'

type vlrSuiteParams = {
  header: Las.Vlr.OffsetInfo
  vlrs: Las.Vlr[]
}
// export const vlrs = async (
//   get: Getter,
//   info: Las.Vlr.OffsetInfo,
// ): Check.Suite.Nested<vlrSuiteParams> => {
//   try {
//     const vlrs = await Las.Vlr.walk(get, info)
//     return { source: { header: info, vlrs }, suite: vlrSuite }
//   } catch (error) {
//     throw error
//     // TODO: Check VLR data manually for possible errors
//   }
// }

// export default vlrs

// mimic Las.Vlr.walk but don't throw errors
export const vlrSourcer = async (
  get: Getter,
  offsetInfo?: Las.Vlr.OffsetInfo,
): Check.Suite.Nested<any> => {
  try {
    const info = offsetInfo || (await getterToHeader(get)).info
    const vlrs = await Las.Vlr.walk(get, info)
    // if Las.Vlr.walk() succeeds, we can reuse the checks/las/vlr suite
    return {
      source: { header: info, vlrs },
      suite: vlrSuite,
    }
  } catch (error) {
    return vlrParseSourcer(get)
  }
}

export default vlrSourcer

export const vlrParseSourcer = async (
  get: Getter,
  suite: Check.Suite<vlrParams> = manualVlrSuite,
): Check.Suite.Nested<vlrParams> => {
  const { info } = await getterToHeader(get)
  const vlrs = await doWalk({
    get,
    startOffset: info.headerLength,
    count: info.vlrCount,
    isExtended: false,
  })
  const evlrs = await doWalk({
    get,
    startOffset: info.evlrOffset,
    count: info.evlrCount,
    isExtended: true,
  })
  return { source: { get, vlrs: [...vlrs, ...evlrs] }, suite }
}

// I'm not exactly sure what purpose this suite serves since Las.Vlr.walk()
// doesn't really fail outside of Las.Vlr.doWalk(), so this should not actually
// see much real-world execution. But I'm copying the structure of ./header.ts
// since that seems to work out so far
type vlrParams = { get: Getter; vlrs: Las.Vlr[] }
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
    // try {
    //   const p = proj4(wkt)
    //   //console.log(p)
    //   return Statuses.success
    // } catch (error) {
    //   return Statuses.failureWithInfo(
    //     `Unable to initialize proj4 with WKT string`,
    //   )
    // }
  },
}

type DoWalk = {
  get: Getter
  startOffset: number
  count: number
  isExtended: boolean
}
async function doWalk({ get, startOffset, count, isExtended }: DoWalk) {
  const vlrs: Las.Vlr[] = []
  let pos = startOffset

  const length = isExtended
    ? Las.Constants.evlrHeaderLength
    : Las.Constants.vlrHeaderLength

  for (let i = 0; i < count; ++i) {
    const buffer = length ? await get(pos, pos + length) : new Uint8Array()
    const { userId, recordId, contentLength, description } = Las.Vlr.parse(
      buffer,
      isExtended,
    )
    vlrs.push({
      userId,
      recordId,
      contentOffset: pos + length,
      contentLength,
      description,
      isExtended,
    })
    pos += length + contentLength
  }

  return vlrs
}
