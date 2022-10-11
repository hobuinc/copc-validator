import { invokeAllChecks } from '../../checks'
import { Binary, getBigUint64, Getter, Las, parseBigInt } from 'copc'
import { Check } from 'types'
import vlrSuite from '../vlrs'

export const vlrs: Check.Suite<{ get: Getter; info: Las.Vlr.OffsetInfo }> = {
  vlrWalkTest: async ({ get, info }) => {
    // I believe the try{}catch{} around this suite wasn't accomplishing anything
    // due to the try{}catch{} inside the checkPromise function (src/utils.ts), but
    // I'll test further to be sure before I work more on this

    // try {
    const vlrs = await Las.Vlr.walk(get, info)
    // If Las.Vlr.walk() succeeds, we can pass the Vlr[] object to the other Vlr suite
    return invokeAllChecks({
      source: { header: info, vlrs },
      suite: vlrSuite,
    })
    // } catch (error) {
    // Try to manually find where and why Las.Vlr.walk() failed
    // }
  },
}

export default vlrs
