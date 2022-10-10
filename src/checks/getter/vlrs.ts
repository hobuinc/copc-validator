import { invokeAllChecks } from '../../checks'
import { Binary, getBigUint64, Getter, Las, parseBigInt } from 'copc'
import { Check } from 'types'
import vlrSuite from '../vlrs'

export const vlrs: Check.Suite<{ get: Getter; info: Las.Vlr.OffsetInfo }> = {
  vlrWalkTest: async ({ get, info }) => {
    try {
      const vlrs = await Las.Vlr.walk(get, info)
      // If Las.Vlr.walk() succeeds, we can pass the Vlr[] object to the other Vlr suite
      return invokeAllChecks({
        source: { header: info, vlrs },
        suite: vlrSuite,
      })
    } catch (error) {
      // Try to manually find where and why Las.Vlr.walk() failed

      // ...but not like this, which accompishes nothing more than Las.Vlr.walk()
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
      return [
        {
          id: 'GetterVLR-NestedSuite',
          status: 'fail',
          info: [...vlrs, ...evlrs],
        },
      ]
    }
  },
}

export default vlrs

// Stolen from `copc.js` since it wasn't exported:
// https://github.com/connormanning/copc.js/blob/70fd5a818370fab859aef6c5e040f12c7062feca/src/las/vlr.ts#L102
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
