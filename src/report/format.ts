import { Binary, Bounds, Getter, Info, Las } from 'copc'
import { Buffer } from 'buffer/'
// import proj4 from '@landrush/proj4'
import wktparser from '@landrush/wkt-parser'

export type Metadata = {
  comp_spacialreference: string
  copc: boolean
  copc_info?: CopcInfo
  count: number
  creation_doy: number
  creation_year: number
  dataformat_id: number
  dataoffset: number
  filesource_id: number
  global_encoding: number
  global_encoding_base64: string
  gtiff?: string
  header_size: number
  major_version: number
  maxx: number
  maxy: number
  maxz: number
  minor_version: number
  minx: number
  miny: number
  minz: number
  offset_x: number
  offset_y: number
  offset_z: number
  point_length: number
  project_id: string
  scale_x: number
  scale_y: number
  scale_z: number
  software_id: string
  spacial_reference: string
  srs?: SrsData
  system_id: string
  [vlr: string]:
    | VlrData
    | string
    | number
    | boolean
    | (CopcInfo | undefined)
    | SrsData
}
type CopcInfo = {
  center_x: number
  center_y: number
  center_z: number
  gpstime_maximum: number
  gpstime_minimum: number
  halfsize: number
  root_hier_offset: number
  root_hier_size: number
  spacing: number
}
export type VlrData = {
  data: string
  description: string
  record_id: number
  user_id: string
}
type SrsData = {
  compoundwkt: string
  horizontal: string
  isgeocentric: boolean
  isgeographic: boolean
  json: string
  prettycompoundwkt: string
  prettywkt: string
  proj4: string
  units: {
    horizontal: string
    vertical: string
  }
  vertical: string
  wkt: string
}
export const headerToMetadata = async ({
  header: {
    // fileSignature,
    fileSourceId: filesource_id,
    globalEncoding: global_encoding,
    projectId: project_id,
    majorVersion: major_version,
    minorVersion: minor_version,
    systemIdentifier: system_id,
    generatingSoftware: software_id,
    fileCreationDayOfYear: creation_doy,
    fileCreationYear: creation_year,
    headerLength: header_size,
    pointDataOffset: dataoffset,
    // vlrCount,
    pointDataRecordFormat: dataformat_id,
    pointDataRecordLength: point_length,
    pointCount: count,
    // pointCountByReturn,
    scale: [scale_x, scale_y, scale_z],
    offset: [offset_x, offset_y, offset_z],
    min: [minx, miny, minz],
    max: [maxx, maxy, maxz],
    // waveformDataOffset,
    // evlrOffset,
    // evlrCount,
  },
  vlrs,
  info,
  // wkt,
  get,
}: {
  header: Las.Header
  vlrs: Las.Vlr[]
  info?: Info
  // wkt?: string
  get: Getter
}): Promise<{ metadata: Metadata }> => {
  const copc = (() => {
    if (!info) return { copc: false }
    const [center_x, center_y, center_z] = Bounds.mid(info.cube)
    const {
      cube: [minx, miny, minz, maxx, maxy, maxz],
      gpsTimeRange: [gpstime_minimum, gpstime_maximum],
      spacing,
      rootHierarchyPage: {
        pageOffset: root_hier_offset,
        pageLength: root_hier_size,
      },
    } = info
    const halfsize = (maxx - minx + maxy - miny + maxz - minz) / 6
    return {
      copc: true,
      copc_info: {
        center_x,
        center_y,
        center_z,
        gpstime_maximum,
        gpstime_minimum,
        halfsize,
        root_hier_offset,
        root_hier_size,
        spacing,
      },
    }
  })()
  const wkt: string | undefined = await (async () => {
    const vlr = Las.Vlr.find(vlrs, 'LASF_Projection', 2112)
    if (!vlr) return
    return Binary.toCString(await Las.Vlr.fetch(get, vlr))
  })()
  const srs: SrsData | undefined = (() => {
    if (!wkt) return
    const wktParsed = wktparser(wkt)
    const { units, vunits } = wktParsed
    if (units === 'meter') units === 'metre'
    if (vunits === 'meter') vunits === 'metre'
    return {
      compoundwkt: '<COMING SOON>', //wkt,
      horizontal: '<COMING SOON>',
      isgeocentric: false,
      isgeographic: false,
      json: '<COMING SOON>',
      prettycompoundwkt: '<COMING SOON>', //wkt,
      prettywkt: '<COMING SOON>', //wkt,
      proj4: '<COMING SOON>',
      units: {
        horizontal: units || '',
        vertical: vunits || units || '',
      },
      vertical: '<COMING SOON>',
      wkt,
    }
  })()
  const vlrMap = await Promise.all(
    vlrs.map<Promise<VlrData>>(
      async ({
        userId: user_id,
        recordId: record_id,
        description,
        ...content
        // contentOffset,
        // contentLength,
      }) => ({
        data: Buffer.from(
          await Las.Vlr.fetch(get, content as Las.Vlr),
        ).toString('base64'),
        description,
        record_id,
        user_id,
      }),
    ),
  )
  const gtiff = ((): string | undefined => {
    const [GeoKeyDirectoryTag, GeoDoubleParamsTag, GeoAsciiParamsTag] =
      vlrMap.reduce<
        [VlrData | undefined, VlrData | undefined, VlrData | undefined]
      >(
        (acc, vlr) => {
          if (vlr.user_id !== 'LASF_Projection') return acc
          if (vlr.record_id === 34735) acc[0] = vlr
          if (vlr.record_id === 34736) acc[1] = vlr
          if (vlr.record_id === 34737) acc[2] = vlr
          return acc
        },
        [undefined, undefined, undefined],
      )
    if (!GeoKeyDirectoryTag) return
    return parseGeoTiff(
      Binary.toDataView(Buffer.from(GeoKeyDirectoryTag.data, 'base64')),
      GeoAsciiParamsTag && Buffer.from(GeoAsciiParamsTag.data, 'base64'),
      GeoDoubleParamsTag && Buffer.from(GeoDoubleParamsTag.data, 'base64'),
    )
  })()

  return {
    metadata: {
      comp_spacialreference: wkt || '',
      ...copc,
      count,
      creation_doy,
      creation_year,
      dataformat_id,
      dataoffset,
      filesource_id,
      global_encoding,
      global_encoding_base64: Buffer.from([global_encoding, 0]).toString(
        'base64',
      ),
      gtiff,
      header_size,
      major_version,
      maxx,
      maxy,
      maxz,
      minor_version,
      minx,
      miny,
      minz,
      offset_x,
      offset_y,
      offset_z,
      point_length,
      project_id,
      scale_x,
      scale_y,
      scale_z,
      software_id,
      spacial_reference: wkt || '',
      srs,
      system_id,
      ...vlrMap.reduce<Record<string, VlrData>>((acc, vlr, idx) => {
        acc[`vlr_${idx}`] = vlr
        return acc
      }, {}),
    },
  }
}

//http://geotiff.maptools.org/spec/geotiff2.4.html
//https://www.asprs.org/wp-content/uploads/2019/07/LAS_1_4_r15.pdf
/* eslint-disable-next-line */
export const parseGeoTiff = (dv: DataView, ascii?: Buffer, double?: Buffer) => {
  const getValue = (offset: number) => dv.getUint16(offset, true)
  const readAscii = (start: number, end?: number): string => {
    if (!ascii) return ''
    return ascii.toString('ascii').slice(start, end)
  }
  const header = {
    keyDirectoryVersion: getValue(0),
    keyRevision: getValue(2),
    minorRevision: getValue(4),
    numberOfKeys: getValue(6),
  }
  const keyEntries: KeyEntry[] = []
  for (let i = 8; i < header.numberOfKeys * 8 + 8; i = i + 8) {
    keyEntries.push({
      keyId: getValue(i),
      tiffTagLocation: getValue(i + 2),
      count: getValue(i + 4),
      valueOffset: getValue(i + 6),
    })
  }
  let message = `Geotiff_Information:\n   Version: ${header.keyDirectoryVersion}\n   Key_Revision: ${header.keyRevision}.${header.minorRevision}\n   Tagged_Information:\n      End_Of_Tags.\n   Keyed_Information:`
  keyEntries.forEach(({ keyId, tiffTagLocation, count, valueOffset }) => {
    let value: number | string = valueOffset
    let prefix: 'Short' | 'Ascii' = 'Short'
    const geoKey = KeyIdDictionary[keyId]
    if (geoKey.translate) value = geoKey.translate(value)
    if (tiffTagLocation === 34737) {
      value = readAscii(valueOffset, valueOffset + count - 1)
      prefix = 'Ascii'
    }
    message += `\n      ${geoKey.name} (${prefix},${count}): ${
      prefix === 'Ascii' ? JSON.stringify(value) : value
    }`
  })
  message += '\n     End_Of_Keys.\n   End_Of_Geotiff.\n'
  return message
}
type KeyEntry = {
  keyId: number
  tiffTagLocation: number
  count: number
  valueOffset: number
}
const ModelTypeCodes: Record<number, string> = {
  1: 'ModelTypeProjected',
  2: 'ModelTypeGeographic',
  3: 'ModelTypeGeocentric',
}
const RasterTypeCodes: Record<number, string> = {
  1: 'RasterPixelIsArea',
  2: 'RasterPixelIsPoint',
}
const AngularUnitsCodes: Record<number, string> = {
  9101: 'Angular_Radian',
  9102: 'Angular_Degree',
  9103: 'Angular_Arc_Minute',
  9104: 'Angular_Arc_Second',
  9105: 'Angular_Grad',
  9106: 'Angular_Gon',
  9107: 'Angular_DMS',
  9108: 'Angular_DMS_Hemisphere',
}
const LinearUnitsCodes: Record<number, string> = {
  9001: 'Linear_Meter',
  9002: 'Linear_Foot',
  9003: 'Linear_Foot_US_Survey',
  9004: 'Linear_Foot_Modified_American',
  9005: 'Linear_Foot_Clarke',
  9006: 'Linear_Foot_Indian',
  9007: 'Linear_Link',
  9008: 'Linear_Link_Benoit',
  9009: 'Linear_Link_Sears',
  9010: 'Linear_Chain_Benoit',
  9011: 'Linear_Chain_Sears',
  9012: 'Linear_Yard_Sears',
  9013: 'Linear_Yard_Indian',
  9014: 'Linear_Fathom',
  9015: 'Linear_Mile_International_Nautical',
}
type KeyData = {
  name: string
  translate?: (n: number) => string
  //dictionary?: Record<number, string>
}
const KeyIdDictionary: Record<number, KeyData> = {
  // GeoTIFF Configuration Keys
  1024: {
    name: 'GTModelTypeGeoKey',
    translate: (n) => ModelTypeCodes[n],
  },
  1025: {
    name: 'GTRasterTypeGeoKey',
    translate: (n) => RasterTypeCodes[n],
  },
  1026: { name: 'GTCitationGeoKey' },
  // Geographic CS Parameter Keys
  // 2048: 'GeographicTypeGeoKey',
  2049: { name: 'GeogCitationGeoKey' },
  2054: {
    name: 'GeogAngularUnitsGeoKey',
    translate: (n) => AngularUnitsCodes[n],
  },
  // Projected CS Parameter Keys
  3072: {
    name: 'ProjectedCSTypeGeoKey',
    translate: (n) => `Code-${n}`,
  },
  3076: {
    name: 'ProjLinearUnitsGeoKey',
    translate: (n) => LinearUnitsCodes[n],
  },
}

//"
//Geotiff_Information:
//   Version: 1
//   Key_Revision: 1.0
//   Tagged_Information:
//     End_Of_Tags.
//   Keyed_Information:
//     GTModelTypeGeoKey (Short,1): ModelTypeProjected
//     GTRasterTypeGeoKey (Short,1): RasterPixelIsArea
//     GTCitationGeoKey (Ascii,25): \"WGS 84 / Pseudo-Mercator\"
//     GeogCitationGeoKey (Ascii,7): \"WGS 84\"
//     GeogAngularUnitsGeoKey (Short,1): Angular_Degree
//     ProjectedCSTypeGeoKey (Short,1): Code-3857 (WGS 84 / Pseudo-Mercator)
//     ProjLinearUnitsGeoKey (Short,1): Linear_Meter
//     End_Of_Keys.\n
//   End_Of_Geotiff.\n
//",
