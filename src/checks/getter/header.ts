import { basicCheck, complexCheck, invokeAllChecks, Statuses } from 'checks'
import { Binary, getBigUint64, Getter, Las, parseBigInt, Point } from 'copc'
import { Check } from 'types'
import lasHeaderSuite from 'checks/las/header'

export const header: Check.Suite<{
  get: Getter
  buffer: Binary
  dv: DataView
}> = {
  tryLasParse: async ({ buffer, dv }) => {
    try {
      const header = Las.Header.parse(buffer)
      // If Las.Header.parse() didn't throw the error, we can reuse the lasHeaderSuite checks
      return invokeAllChecks({ source: header, suite: lasHeaderSuite })
    } catch (error) {
      return invokeAllChecks({ source: { buffer, dv }, suite: manualParse })
    }
  },
}

// This is currently a mess and doesn't work very well, but I'll get back to it
export type RelevantHeader = Pick<
  Las.Header,
  | 'majorVersion'
  | 'minorVersion'
  | 'headerLength'
  | 'pointDataRecordFormat'
  | 'pointCount'
  | 'pointCountByReturn'
> & {
  fileSignature: string
  legacyPointCount: number
  legacyPointCountByReturn: number[]
}
export const manualParse: Check.Suite<{ buffer: Binary; dv: DataView }> = {
  manualLasParse: async ({ buffer, dv }) => {
    if (buffer.byteLength < Las.Constants.minHeaderLength)
      return [
        {
          id: 'header-get.parse',
          status: 'fail',
          info: `Invalid header: must be at least ${Las.Constants.minHeaderLength} bytes`,
        },
      ]
    const fileSignature = Binary.toCString(buffer.slice(0, 4))
    const majorVersion = dv.getUint8(24)
    const minorVersion = dv.getUint8(25)
    // was erroring on tests with parseBigInt() so I trimmed down as much as I could,
    // but I couldn't find a file that would fail Las.Header.parse() but would not error
    // on my manualParse, so I'm just manually testing fullHeaderSuite
    const header: RelevantHeader = {
      fileSignature,
      // fileSourceId: dv.getUint16(4, true),
      // globalEncoding: dv.getUint16(6, true),
      // projectId: formatGuid(buffer.slice(8, 24)),
      majorVersion,
      minorVersion,
      // systemIdentifier: Binary.toCString(buffer.slice(26, 58)),
      // generatingSoftware: Binary.toCString(buffer.slice(58, 90)),
      // fileCreationDayOfYear: dv.getUint16(90, true),
      // fileCreationYear: dv.getUint16(92, true),
      headerLength: dv.getUint16(94, true),
      // pointDataOffset: dv.getUint32(96, true),
      // vlrCount: dv.getUint32(100, true),
      pointDataRecordFormat: dv.getUint8(104) & 0b1111,
      // pointDataRecordLength: dv.getUint16(105, true),
      legacyPointCount: dv.getUint32(107, true),
      legacyPointCountByReturn: parseLegacyNumberOfPointsByReturn(
        buffer.slice(111, 131),
      ),
      // scale: parsePoint(buffer.slice(131, 155)),
      // offset: parsePoint(buffer.slice(155, 179)),
      // min: [
      //   dv.getFloat64(187, true),
      //   dv.getFloat64(203, true),
      //   dv.getFloat64(219, true),
      // ],
      // max: [
      //   dv.getFloat64(179, true),
      //   dv.getFloat64(195, true),
      //   dv.getFloat64(211, true),
      // ],
      pointCount: parseBigInt(getBigUint64(dv, 247, true)),
      pointCountByReturn: parseNumberOfPointsByReturn(buffer.slice(255, 375)),
      // waveformDataOffset: parseBigInt(getBigUint64(dv, 227, true)),
      // evlrOffset: parseBigInt(getBigUint64(dv, 235, true)),
      // evlrCount: dv.getUint32(243, true),
    }
    return invokeAllChecks({ source: header, suite: fullHeaderSuite })
  },
}

export const fullHeaderSuite: Check.Suite<RelevantHeader> = {
  fileSignature: ({ fileSignature }) =>
    complexCheck(
      fileSignature,
      'LASF',
      false,
      `('LASF') File Signature: '${fileSignature}'`,
    ),
  majorVersion: ({ majorVersion }) =>
    complexCheck(majorVersion, 1, false, `(1) Major Version: ${majorVersion}`),
  'minorVersion-manualParse': ({ minorVersion }) =>
    complexCheck(minorVersion, 4, false, `(4) Minor Version: ${minorVersion}`),
  'headerLength-manualParse': ({ headerLength }) =>
    complexCheck(
      headerLength,
      (n) => n >= Las.Constants.minHeaderLength,
      false,
      `(>=375) Header Length: ${headerLength}`,
    ),
  legacyPointCount: ({ pointDataRecordFormat, pointCount, legacyPointCount }) =>
    basicCheck(
      { pointDataRecordFormat, pointCount, legacyPointCount },
      ({ pointDataRecordFormat, pointCount, legacyPointCount }) =>
        ([6, 7, 8, 9, 10].includes(pointDataRecordFormat) &&
          legacyPointCount === 0) ||
        (pointCount < UINT32_MAX && legacyPointCount === pointCount) ||
        legacyPointCount === 0,
    ),
  legacyNumberOfPointsByReturn: ({
    pointDataRecordFormat,
    pointCount,
    legacyPointCount,
    legacyPointCountByReturn,
  }) =>
    complexCheck(
      {
        pointDataRecordFormat,
        pointCount,
        legacyPointCount,
        legacyPointCountByReturn,
      },
      ({
        pointDataRecordFormat,
        pointCount,
        legacyPointCount,
        legacyPointCountByReturn,
      }) =>
        ([6, 7, 8, 9, 10].includes(pointDataRecordFormat) &&
          legacyPointCountByReturn.every((n) => n === 0)) ||
        (pointCount < UINT32_MAX &&
          pointCount === legacyPointCount &&
          legacyPointCountByReturn.reduce((p, c) => p + c, 0) === pointCount) ||
        legacyPointCountByReturn.reduce((p, c) => p + c, 0) ===
          legacyPointCount,
      true,
      `Count: ${legacyPointCount}  ByReturn: ${legacyPointCountByReturn}`,
    ),
}

export default header

// =========== LAS HEADER UTILS ==========
export function parseNumberOfPointsByReturn(buffer: Binary): number[] {
  const dv = Binary.toDataView(buffer)
  const bigs: BigInt[] = []
  for (let offset = 0; offset < 15 * 8; offset += 8) {
    bigs.push(getBigUint64(dv, offset, true))
  }
  return bigs.map((v) => parseBigInt(v))
}

export function parseLegacyNumberOfPointsByReturn(buffer: Binary): number[] {
  const dv = Binary.toDataView(buffer)
  const v: number[] = []
  for (let offset = 0; offset < 5 * 4; offset += 4) {
    v.push(dv.getUint32(offset, true))
  }
  return v
}

export function parsePoint(buffer: Binary): Point {
  const dv = Binary.toDataView(buffer)
  if (dv.byteLength !== 24) {
    throw new Error(`Invalid tuple buffer length: ${dv.byteLength}`)
  }
  return [
    dv.getFloat64(0, true),
    dv.getFloat64(8, true),
    dv.getFloat64(16, true),
  ]
}

export function formatGuid(buffer: Binary): string {
  const dv = Binary.toDataView(buffer)
  if (dv.byteLength !== 16) {
    throw new Error(`Invalid GUID buffer length: ${dv.byteLength}`)
  }

  let s = ''
  for (let i = 0; i < dv.byteLength; i += 4) {
    const c = dv.getUint32(i, true)
    s += c.toString(16).padStart(8, '0')
  }

  return [s.slice(0, 8), s.slice(8, 12), s.slice(12, 16), s.slice(16, 32)].join(
    '-',
  )
}

const UINT32_MAX = 4_294_967_295
