import { Getter, Las } from 'copc'
import headerSuite from './header'
import vlrSuite from './vlrs'
import { Check } from 'types'
import { invokeAllChecks } from '../../checks'

// TODO: Rewrite LAS checks

export const LasSuite: Check.Suite<Getter> = {
  lasParse: async (get) => {
    try {
      const header = Las.Header.parse(
        await get(0, Las.Constants.minHeaderLength),
      )
      // Las.Header.parse() can fail for the following reasons:
      //   - buffer.byteLength < minHeaderLength (375)
      //   - fileSignature (first 4 bytes) !== 'LASF'
      //   - majorVersion !== 1 || minorVersion !== 2 | 4
      //   - Corrupt/bad binary data
      const vlrs = await Las.Vlr.walk(get, header)
      // Las.Vlr.walk() can fail for the following reasons:
      //   - vlrHeaderLength !== 54
      //   - evlrHeaderLength !== 60
      //   - Corrupt/bad binary data
      return invokeAllChecks([
        { source: header, suite: headerSuite },
        { source: { header, vlrs }, suite: vlrSuite },
      ])
    } catch (error) {
      return [{ id: 'lasParse-NestedSuite', status: 'fail', info: error }]
    }
  },
}
