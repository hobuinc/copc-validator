import { basicCheck, invokeAllChecks } from 'checks'
import { Binary, getBigUint64, Getter, Las, parseBigInt, Point } from 'copc'
import { Check } from 'types'
import headerSuite from './header'
import vlrSuite from './vlrs'

// doesn't seem to export buildHeaderParseSuite or copcHeaderSuite ¯\_(ツ)_/¯
export * from './header'

export const GetterSuite: Check.Suite<Getter> = {
  decode: async (get) => {
    const { buffer, info } = await getterToHeader(get)
    // using a NestedSuite to call other NestedSuites that check Las.Header.parse()
    // and Las.Vlr.walk() for why and where they (may have) failed
    return invokeAllChecks([
      // checks for why Las.Header.parse() may have failed
      {
        source: { get, buffer },
        suite: headerSuite,
      },
      // checks for why Las.Vlr.walk() may have failed
      {
        source: { get, info },
        suite: vlrSuite,
      },
    ])
  },
}

// Need info to run VLR tests, so I might as well steal the buffer and DataView
export const getterToHeader = async (get: Getter) => {
  const buffer = await get(0, Las.Constants.minHeaderLength)
  const dv = Binary.toDataView(buffer)
  const info: Las.Vlr.OffsetInfo = ((minorVersion: number) => {
    const header = {
      headerLength: dv.getUint16(94, true),
      vlrCount: dv.getUint32(100, true),
      evlrOffset: 0,
      evlrCount: 0,
    }
    if (minorVersion !== 4) return header
    return {
      ...header,
      evlrOffset: parseBigInt(getBigUint64(dv, 235, true)),
      evlrCount: dv.getUint32(243, true),
    }
  })(dv.getUint8(25))
  return { buffer, info, dv }
}
