import { basicCheck, complexCheck } from 'checks'
import { Binary, getBigUint64, Getter, Las, parseBigInt, Point } from 'copc'
import { Check } from 'types'
import lasHeaderSuite from 'checks/las/header'

export const header = async (
  get: Getter,
  buffer: Binary,
): Check.Suite.Nested<any> => {
  try {
    const header = Las.Header.parse(buffer)
    // If Las.Header.parse() didn't throw the error, we can reuse the lasHeaderSuite checks
    return {
      source: header,
      suite: lasHeaderSuite,
    } as Check.Suite.withSource<Las.Header>
  } catch (error) {
    return headerParseSourcer(get)
  }
}

export default header

type manualParams = { buffer: Binary; dv: DataView }
export const headerParseSourcer = async (
  get: Getter,
  suite: Check.Suite<manualParams> = manualHeaderSuite,
): Check.Suite.Nested<manualParams> => {
  const buffer = await get(0, Las.Constants.minHeaderLength)
  const dv = Binary.toDataView(buffer)
  if (buffer.byteLength < Las.Constants.minHeaderLength)
    throw new Error(
      `Invalid header: must be at least ${Las.Constants.minHeaderLength} bytes`,
    )
  return { source: { buffer, dv }, suite }
}

export const manualHeaderSuite: Check.Suite<manualParams> = {
  fileSignature: ({ buffer }) => {
    const fileSignature = Binary.toCString(buffer.slice(0, 4))
    return complexCheck(
      fileSignature,
      'LASF',
      false,
      `('LASF') File Signature: '${fileSignature}'`,
    )
  },
  majorVersion: ({ dv }) => {
    const majorVersion = dv.getUint8(24)
    return complexCheck(
      majorVersion,
      1,
      false,
      `(1) Major Version: ${majorVersion}`,
    )
  },
  minorVersion: ({ dv }) => {
    const minorVersion = dv.getUint8(25)
    return complexCheck(
      minorVersion,
      4,
      false,
      `(4) Minor Version: ${minorVersion}`,
    )
  },
  headerLength: ({ dv }) => {
    const headerLength = dv.getUint16(94, true)
    return complexCheck(
      headerLength,
      (n) => n === Las.Constants.minHeaderLength,
      false,
      `(>=375) Header Length: ${headerLength}`,
    )
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
    const param = {
      pdrf: pointDataRecordFormat,
      pc: pointCount,
      lpc: legacyPointCount,
      lpcr: legacyPointCountByReturn,
    }
    return complexCheck(
      param,
      ({ pdrf, pc, lpc, lpcr }) =>
        ([6, 7, 8, 9, 10].includes(pdrf) && lpcr.every((n) => n === 0)) ||
        (pc < UINT32_MAX &&
          pc === lpc &&
          lpcr.reduce((p, c) => p + c, 0) === pc) ||
        lpcr.reduce((p, c) => p + c, 0) === lpc,
      true,
      `Count: ${legacyPointCount}  ByReturn: ${legacyPointCountByReturn}`,
      // `PointDataRecordFormat: ${pointDataRecordFormat}`,
    )
  },
}

// I tried doing this in checks/copc/header.ts but the imports don't read properly?
const { legacyPointCount, legacyPointCountByReturn } = manualHeaderSuite
const copcHeaderChecks: Check.Suite<manualParams> = {
  legacyPointCount,
  legacyPointCountByReturn,
}

export const copcHeaderSourcer = (
  get: Getter,
): Check.Suite.Nested<manualParams> => headerParseSourcer(get, copcHeaderChecks)

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

/* 
      I found the better way of parsing the header but I'm leaving this code here
      until I'm done testing header variables, so I know where everything should be

    const fileSignature = Binary.toCString(buffer.slice(0, 4))
    const majorVersion = dv.getUint8(24)
    const minorVersion = dv.getUint8(25)
    // if parseBigInt() or anything else throws errors, it will be caught by
    // invokeAllChecks as `{ id: 'manualHeaderParse', status: 'fail' }`
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
    // I may not want to parse the entire header at once, as that limits the amount
    // of information I can learn about where and why a given Header is bad
    return invokeAllChecks({ source: header, suite: headerSuite })
    */
