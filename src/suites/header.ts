import { Las, Binary, parseBigInt, getBigUint64 } from 'copc'
import type { Check, manualHeaderParams as manualParams } from 'types'
import {
  basicCheck,
  complexCheck,
  parseNumberOfPointsByReturn,
  parseLegacyNumberOfPointsByReturn,
  UINT32_MAX,
} from 'utils'

export const headerSuite: Check.Suite<Las.Header> = {
  minorVersion: ({ minorVersion }) => basicCheck(minorVersion, 4),
  pointDataRecordFormat: ({ pointDataRecordFormat }) =>
    complexCheck({
      source: pointDataRecordFormat,
      checker: [6, 7, 8],
      infoOnFailure: `(6,7,8) Point Data Record Format: ${pointDataRecordFormat}`,
    }),
  headerLength: ({ headerLength }) =>
    basicCheck(headerLength, Las.Constants.minHeaderLength),
  pointCountByReturn: ({ pointCount, pointCountByReturn }) =>
    basicCheck(
      pointCountByReturn.reduce((p, c) => p + c, 0),
      pointCount,
    ),
}

export default headerSuite

export const manualHeaderSuite: Check.Suite<manualParams> = {
  fileSignature: ({ buffer }) => {
    const fileSignature = Binary.toCString(buffer.slice(0, 4))
    return complexCheck({
      source: fileSignature,
      checker: 'LASF',
      infoOnFailure: `('LASF') File Signature: '${fileSignature}'`,
    })
  },
  majorVersion: ({ dv }) => {
    const majorVersion = dv.getUint8(24)
    return complexCheck({
      source: majorVersion,
      checker: 1,
      infoOnFailure: `(1) Major Version: ${majorVersion}`,
    })
  },
  minorVersion: ({ dv }) => {
    const minorVersion = dv.getUint8(25)
    return complexCheck({
      source: minorVersion,
      checker: 4,
      infoOnFailure: `(4) Minor Version: ${minorVersion}`,
    })
  },
  headerLength: ({ dv }) => {
    const headerLength = dv.getUint16(94, true)
    return complexCheck({
      source: headerLength,
      checker: (n) => n === Las.Constants.minHeaderLength,
      infoOnFailure: `(>=375) Header Length: ${headerLength}`,
    })
  },
  legacyPointCount: ({ dv }) => {
    const pointDataRecordFormat = dv.getUint8(104) & 0b1111
    const legacyPointCount = dv.getUint32(107, true)
    const pointCount = parseBigInt(getBigUint64(dv, 247, true))
    const param = {
      pdrf: pointDataRecordFormat,
      pc: pointCount,
      lpc: legacyPointCount,
    }
    return basicCheck(
      param,
      ({ pdrf, pc, lpc }) =>
        ([6, 7, 8, 9, 10].includes(pdrf) && lpc === 0) ||
        (pc < UINT32_MAX && lpc === pc) ||
        lpc === 0,
    )
  },
  legacyPointCountByReturn: ({ dv, buffer }) => {
    const pointDataRecordFormat = dv.getUint8(104) & 0b1111
    const legacyPointCount = dv.getUint32(107, true)
    const legacyPointCountByReturn = parseLegacyNumberOfPointsByReturn(
      buffer.slice(111, 131),
    )
    const pointCount = parseBigInt(getBigUint64(dv, 247, true))
    const pointCountByReturn = parseNumberOfPointsByReturn(
      buffer.slice(255, 375),
    ) // not doing anything with this yet, but including it increases jest coverage
    return complexCheck({
      source: {
        pdrf: pointDataRecordFormat,
        pc: pointCount,
        lpc: legacyPointCount,
        lpcr: legacyPointCountByReturn,
      },
      checker: ({ pdrf, pc, lpc, lpcr }) =>
        ([6, 7, 8, 9, 10].includes(pdrf) && lpcr.every((n) => n === 0)) ||
        (pc < UINT32_MAX &&
          pc === lpc &&
          lpcr.reduce((p, c) => p + c, 0) === pc) ||
        lpcr.reduce((p, c) => p + c, 0) === lpc,
      infoOnFailure: `Count: ${legacyPointCount}  ByReturn: ${legacyPointCountByReturn}`,
      warning: true,
    })
  },
}
