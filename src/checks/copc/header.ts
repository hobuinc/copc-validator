import {
  Binary,
  Copc,
  getBigUint64,
  Getter,
  Las,
  parseBigInt,
  Point,
} from 'copc'
import { basicCheck, invokeAllChecks, Statuses } from '../../checks'
import { Check } from 'types'

export const header: Check.Suite<Copc> = {
  // This check is redundant with Copc.create()
  fileSignature: (c) => basicCheck(c.header.fileSignature, 'LASF'),
  // This check is redundant with Copc.create()
  majorVersion: (c) => basicCheck(c.header.majorVersion, 1),
  // This check is not redundant with Copc.create() since it currently allows minorVersion === 2
  minorVersion: (c) => basicCheck(c.header.minorVersion, 4),
  headerLength: (c) =>
    basicCheck(c.header.headerLength, Las.Constants.minHeaderLength),
  pointDataRecordFormat: (c) =>
    basicCheck(c.header.pointDataRecordFormat, [6, 7, 8]),
  pointCountByReturn: (c) =>
    basicCheck(
      c.header.pointCountByReturn.reduce((prev, curr) => prev + curr, 0),
      c.header.pointCount,
    ),
}

export default header

// This suite confirms the legacy values of the header are set correctly
export const headerGetter: Check.Suite<Getter> = {
  parse: async (get) => {
    const buffer = await get(0, Las.Constants.minHeaderLength)
    if (buffer.byteLength < Las.Constants.minHeaderLength)
      return [
        {
          id: 'header-get.parse',
          status: 'fail',
          info: `Invalid header: must be at least ${Las.Constants.minHeaderLength} bytes`,
        },
      ]
    const dv = Binary.toDataView(buffer)
    const fileSignature = Binary.toCString(buffer.slice(0, 4)) as 'LASF'
    // fileSignature === 'LASF' already if this is being invoked
    const majorVersion = dv.getUint8(24)
    const minorVersion = dv.getUint8(25)
    if (majorVersion !== 1 || minorVersion !== 4)
      return [
        {
          id: 'header-get.parse',
          status: 'fail',
          info: `Invalid version (only Las 1.4 supported): ${majorVersion}.${minorVersion}`,
        },
      ]
    const header: FullHeader = {
      fileSignature,
      fileSourceId: dv.getUint16(4, true),
      globalEncoding: dv.getUint16(6, true),
      projectId: formatGuid(buffer.slice(8, 24)),
      majorVersion,
      minorVersion,
      systemIdentifier: Binary.toCString(buffer.slice(26, 58)),
      generatingSoftware: Binary.toCString(buffer.slice(58, 90)),
      fileCreationDayOfYear: dv.getUint16(90, true),
      fileCreationYear: dv.getUint16(92, true),
      headerLength: dv.getUint16(94, true),
      pointDataOffset: dv.getUint32(96, true),
      vlrCount: dv.getUint32(100, true),
      pointDataRecordFormat: dv.getUint8(104) & 0b1111,
      pointDataRecordLength: dv.getUint16(105, true),
      legacyPointCount: dv.getUint32(107, true),
      legacyPointCountByReturn: parseLegacyNumberOfPointsByReturn(
        buffer.slice(111, 131),
      ),
      scale: parsePoint(buffer.slice(131, 155)),
      offset: parsePoint(buffer.slice(155, 179)),
      min: [
        dv.getFloat64(187, true),
        dv.getFloat64(203, true),
        dv.getFloat64(219, true),
      ],
      max: [
        dv.getFloat64(179, true),
        dv.getFloat64(195, true),
        dv.getFloat64(211, true),
      ],
      pointCount: parseBigInt(getBigUint64(dv, 247, true)),
      pointCountByReturn: parseNumberOfPointsByReturn(buffer.slice(255, 375)),
      waveformDataOffset: parseBigInt(getBigUint64(dv, 227, true)),
      evlrOffset: parseBigInt(getBigUint64(dv, 235, true)),
      evlrCount: dv.getUint32(243, true),
    }
    return invokeAllChecks({ source: header, suite: fullHeaderSuite })
  },
}

type FullHeader = Las.Header & {
  legacyPointCount: number
  legacyPointCountByReturn: number[]
}
const fullHeaderSuite: Check.Suite<FullHeader> = {
  legacyPointCount: ({ pointCount, legacyPointCount }) =>
    basicCheck(
      { pointCount, legacyPointCount },
      (n) =>
        (pointCount < UINT32_MAX && legacyPointCount === pointCount) ||
        legacyPointCount === 0,
    ),
  legacyNumberOfPointsByReturn: ({ legacyPointCountByReturn }) =>
    legacyPointCountByReturn.some((num) => num !== 0)
      ? Statuses.success
      : Statuses.failure,
}

// =========== LAS HEADER UTILS ==========

function parseNumberOfPointsByReturn(buffer: Binary): number[] {
  const dv = Binary.toDataView(buffer)
  const bigs: BigInt[] = []
  for (let offset = 0; offset < 15 * 8; offset += 8) {
    bigs.push(getBigUint64(dv, offset, true))
  }
  return bigs.map((v) => parseBigInt(v))
}

function parseLegacyNumberOfPointsByReturn(buffer: Binary): number[] {
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
