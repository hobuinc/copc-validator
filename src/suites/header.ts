import { Las, Binary, parseBigInt, getBigUint64 } from 'copc'
import type { Check, manualHeaderParams } from '../types/index.js'
import {
  basicCheck,
  complexCheck,
  parseNumberOfPointsByReturn,
  parseLegacyNumberOfPointsByReturn,
  UINT32_MAX,
} from '../utils/index.js'

/**
 * Suite of Check Functions for checking the `copc.header` object to validate
 * a `copc.laz` file. Each check here only has access to the Las.Header object
 * so that the test can be reused in the Las and Fallback Collections, in case
 * `Las.Header.parse()` still succeeds after `Copc.create()` fails
 */
export const headerSuite: Check.Suite<{ header: Las.Header }> = {
  minorVersion: {
    function: ({ header: { minorVersion } }) =>
      complexCheck({
        source: minorVersion,
        checker: 4,
        infoOnFailure: `Minor Version: ${minorVersion}`,
      }), //basicCheck(minorVersion, 4),
    description: 'LAS minor version (in header) is 4',
  },
  pointDataRecordFormat: {
    function: ({ header: { pointDataRecordFormat } }) =>
      complexCheck({
        source: pointDataRecordFormat,
        checker: [6, 7, 8],
        infoOnFailure: `Point Data Record Format: ${pointDataRecordFormat}`,
      }),
    description: 'Point Data Record Format (PDRF) (in header) is 6, 7, or 8',
  },
  headerLength: {
    function: ({ header: { headerLength } }) =>
      basicCheck(headerLength, Las.Constants.minHeaderLength),
    description: 'Header Length (in header) is 375',
  },
  pointCountByReturn: {
    function: ({ header: { pointCount, pointCountByReturn } }) => {
      const sum = pointCountByReturn.reduce((p, c) => p + c, 0)
      return complexCheck({
        source: sum,
        checker: pointCount,
        infoOnFailure: `pointCountByReturn sum: ${sum}`,
      })
    },

    description:
      'Point Count (in header) matches sum of Point Count by Return (in header)',
  },
}

export const manualHeaderSuite: Check.Suite<manualHeaderParams> = {
  fileSignature: {
    function: ({ buffer }) => {
      const fileSignature = Binary.toCString(buffer.slice(0, 4))
      return complexCheck({
        source: fileSignature,
        checker: 'LASF',
        infoOnFailure: `File Signature: '${fileSignature}'`,
      })
    },
    description: 'File signature (first 4 bytes) is "LASF"',
  },
  majorVersion: {
    function: ({ dv }) => {
      const majorVersion = dv.getUint8(24)
      return complexCheck({
        source: majorVersion,
        checker: 1,
        infoOnFailure: `Major Version: ${majorVersion}`,
      })
    },
    description: 'Major Version (24th byte) is 1',
  },
  minorVersion: {
    function: ({ dv }) => {
      const minorVersion = dv.getUint8(25)
      return complexCheck({
        source: minorVersion,
        checker: 4,
        infoOnFailure: `Minor Version: ${minorVersion}`,
      })
    },
    description: 'Minor Version (25th byte) is 4',
  },
  headerLength: {
    function: ({ dv }) => {
      const headerLength = dv.getUint16(94, true)
      return complexCheck({
        source: headerLength,
        checker: Las.Constants.minHeaderLength, //(n) => n === Las.Constants.minHeaderLength,
        infoOnFailure: `Header Length: ${headerLength}`,
      })
    },
    description: 'Header Length (94th byte) is 375',
  },
  legacyPointCount: {
    function: ({ dv }) => {
      const pointDataRecordFormat = dv.getUint8(104) & 0b1111
      const legacyPointCount = dv.getUint32(107, true)
      const pointCount = parseBigInt(getBigUint64(dv, 247, true))
      return basicCheck(
        {
          pdrf: pointDataRecordFormat,
          pc: pointCount,
          lpc: legacyPointCount,
        },
        ({ pdrf, pc, lpc }) =>
          ([6, 7, 8, 9, 10].includes(pdrf) && lpc === 0) ||
          (pc < UINT32_MAX && lpc === pc) ||
          lpc === 0,
      )
    },
    description:
      'Legacy Point Count is set according to PDRF value & LAS 1.4 specifications',
  },
  legacyPointCountByReturn: {
    function: ({ dv, buffer }) => {
      const pointDataRecordFormat = dv.getUint8(104) & 0b1111
      const legacyPointCount = dv.getUint32(107, true)
      const legacyPointCountByReturn = parseLegacyNumberOfPointsByReturn(
        buffer.slice(111, 131),
      )
      const pointCount = parseBigInt(getBigUint64(dv, 247, true))
      // eslint-disable-next-line
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
    description:
      'Legacy Point Count by Return is set according to PDRF value & LAS 1.4 specifications',
  },
}
