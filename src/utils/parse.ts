import {
  Binary,
  Getter,
  Las,
  Point,
  getBigUint64,
  parseBigInt,
  Copc,
  Hierarchy,
} from 'copc'

export const loadAllHierarchyPages = async (
  get: Getter,
  c?: Copc,
): Promise<Hierarchy.Node.Map> => {
  const copc = c || (await Copc.create(get))
  const { nodes: n, pages } = await Copc.loadHierarchyPage(
    get,
    copc.info.rootHierarchyPage,
  )
  return {
    ...n,
    ...(
      await Promise.all(
        Object.entries(pages).map(
          async ([, page]) => (await Copc.loadHierarchyPage(get, page!)).nodes, //eslint-disable-line
        ),
      )
    ).reduce((prev, curr) => ({ ...prev, ...curr }), {}),
  }
}

export const UINT32_MAX = 4_294_967_295

export function parseNumberOfPointsByReturn(buffer: Binary): number[] {
  const dv = Binary.toDataView(buffer)
  const bigs: bigint[] = []
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

type DoWalk = {
  get: Getter
  startOffset: number
  count: number
  isExtended: boolean
}
export async function doWalk({ get, startOffset, count, isExtended }: DoWalk) {
  const vlrs: Las.Vlr[] = []
  let pos = startOffset

  const length = isExtended
    ? Las.Constants.evlrHeaderLength
    : Las.Constants.vlrHeaderLength

  for (let i = 0; i < count; ++i) {
    // I don't understand what this statement was doing  ↓                              ↓
    const buffer = await get(pos, pos + length) //length ? await get(pos, pos + length) : new Uint8Array()
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
