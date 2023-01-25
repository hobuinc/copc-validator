import { Binary, Las } from 'copc'
import { Buffer } from 'buffer/'
import omit from 'lodash.omit'
import { generateReport } from 'report'
import { ellipsoidFiles, getCopcItems, getLasItems } from 'test'
import { Report } from 'types'
import { headerToMetadata, parseGeoTiff, VlrData } from './format'

const copcFile = ellipsoidFiles.copc
const copcItems = getCopcItems()
const lasItems = getLasItems()

test('shallow COPC', async () => {
  const { copc, get } = await copcItems
  const shallow = await generateReport({
    source: copcFile,
    options: { showProgress: true },
  }) // default options
  expect(Report.isCopc(shallow)).toBe(true)
  // given this check, the throw below should be unnecessary, but TS doesn't understand
  expect(Report.isFail(shallow)).toBe(false)

  expect(shallow.name).toEqual(copcFile)
  expect(shallow.scan.type).toEqual('shallow')
  expect(shallow.scan.filetype).toEqual('COPC')

  if (!Report.isCopc(shallow))
    throw new Error('generateReport() created the wrong Report.filetype')
  /* eslint-disable-next-line */
  expect(shallow.copc!.header).toEqual(copc.header)
  /* eslint-disable-next-line */
  expect(shallow.copc!.vlrs).toEqual(copc.vlrs)
  /* eslint-disable-next-line */
  expect(shallow.copc!.info).toEqual(copc.info)
  expect(shallow.scan.start <= shallow.scan.end).toBe(true)

  const reportName = 'report'
  const miniShallowWithName = await generateReport({
    source: copcFile,
    options: {
      name: reportName,
      mini: true,
    },
  }) // default `deep`
  expect(miniShallowWithName.name).toEqual(reportName)
  // testing minified report
  expect(miniShallowWithName).toMatchObject(
    expect.objectContaining({
      ...omit(shallow, 'copc'),
      name: reportName,
      // copc: undefined,
      scan: {
        ...shallow.scan,
        end: expect.any(Date),
        start: expect.any(Date),
        time: expect.any(Number),
      },
    }),
  )

  const shallowWithPdal = await generateReport({
    source: ellipsoidFiles.laz14,
    options: { pdal: true },
  })
  /* eslint-disable-next-line */
  expect((shallowWithPdal as Report.SuccessLas).pdal!).toMatchObject(
    headerToMetadata({
      ...copc,
      get, //: Getter.create(ellipsoidFiles.copc),
    }),
  )
})

test('shallow LAS', async () => {
  const { header, vlrs, get } = await lasItems
  const shallow = await generateReport({
    source: ellipsoidFiles.laz14,
    options: { deep: false },
  }) // default `name`
  expect(Report.isLas(shallow)).toBe(true)
  expect(Report.isCopc(shallow)).toBe(false)
  expect(Report.isFail(shallow)).toBe(false)

  expect(shallow.name).toEqual(ellipsoidFiles.laz14)
  expect(shallow.scan.filetype).toEqual('LAS')
  if (!Report.isLas(shallow))
    throw new Error('generateReport() created the wrong Report.filetype')
  /* eslint-disable-next-line */
  expect(shallow.las!.header).toEqual(header)
  /* eslint-disable-next-line */
  expect(shallow.las!.vlrs).toEqual(vlrs)

  const shallowWithPdal = await generateReport({
    source: ellipsoidFiles.laz14,
    options: { pdal: true },
  })
  /* eslint-disable-next-line */
  expect((shallowWithPdal as Report.SuccessLas).pdal!).toMatchObject(
    headerToMetadata({
      header,
      vlrs,
      get, //: Getter.create(ellipsoidFiles.laz14),
    }),
  )
})

test('shallow Unknown', async () => {
  const shallow = await generateReport({
    source: ellipsoidFiles.sh,
    options: {
      name: ellipsoidFiles.sh,
      deep: false,
    },
  }) // default parameters but provided
  expect(Report.isCopc(shallow)).toBe(false)
  expect(Report.isFail(shallow)).toBe(true)

  expect(shallow.name).toEqual(ellipsoidFiles.sh)
  expect(shallow.scan.type).toEqual('shallow')
  expect(shallow.scan.filetype).toEqual('Unknown')
  if (!Report.isFail(shallow))
    throw new Error('generateReport() created the wrong Report.filetype')
  expect((shallow.error as Error).message).toContain('Invalid file signature:')
  // copcError undefined since both lasError & copcError fail for same reason
  expect(shallow.copcError).toBeUndefined()
})

test('deep COPC', async () => {
  const { copc } = await copcItems
  const deep = await generateReport({
    source: copcFile,
    options: { deep: true, showProgress: true },
  }) // default parameters
  expect(Report.isCopc(deep)).toBe(true)
  // given this check, the throw below should be unnecessary, but TS doesn't understand
  expect(Report.isFail(deep)).toBe(false)

  expect(deep.name).toEqual(copcFile)
  expect(deep.scan.type).toEqual('deep')
  expect(deep.scan.filetype).toEqual('COPC')

  if (!Report.isCopc(deep))
    throw new Error('generateReport() created the wrong Report.filetype')
  expect(deep.copc!.header).toEqual(copc.header) //eslint-disable-line
  expect(deep.copc!.vlrs).toEqual(copc.vlrs) //eslint-disable-line
  expect(deep.copc!.info).toEqual(copc.info) //eslint-disable-line
  expect(deep.scan.start <= deep.scan.end).toBe(true)

  const reportName = 'report'
  const deepWithName = await generateReport({
    source: copcFile,
    options: {
      name: reportName,
      deep: true,
    },
  })
  expect(deepWithName.name).toEqual(reportName)
})

test('deep LAS', async () => {
  const { header, vlrs } = await lasItems
  const deep = await generateReport({
    source: ellipsoidFiles.laz14,
    options: { deep: true },
  }) // default `name`
  expect(Report.isLas(deep)).toBe(true)
  expect(Report.isCopc(deep)).toBe(false)
  expect(Report.isFail(deep)).toBe(false)

  expect(deep.name).toEqual(ellipsoidFiles.laz14)
  expect(deep.scan.filetype).toEqual('LAS')
  expect(deep.scan.type).toEqual('deep')
  if (!Report.isLas(deep))
    throw new Error('generateReport() created the wrong Report.filetype')
  expect(deep.las!.header).toEqual(header) //eslint-disable-line
  expect(deep.las!.vlrs).toEqual(vlrs) //eslint-disable-line
})

test('deep Unknown', async () => {
  const deep = await generateReport({
    source: ellipsoidFiles.fake,
    options: {
      name: ellipsoidFiles.fake,
      deep: true,
    },
  }) // default parameters but provided
  expect(Report.isCopc(deep)).toBe(false)
  expect(Report.isFail(deep)).toBe(true)

  expect(deep.name).toEqual(ellipsoidFiles.fake)
  expect(deep.scan.type).toEqual('deep')
  expect(deep.scan.filetype).toEqual('Unknown')
  if (!Report.isFail(deep))
    throw new Error('generateReport() created the wrong Report.filetype')
  expect((deep.error as Error).message).toContain('Invalid header:')
  // copcError undefined since both lasError & copcError fail for same reason
  expect(deep.copcError).toBeUndefined()
})

test('parseGeoTiff', async () => {
  const { vlrs, get } = await getLasItems(ellipsoidFiles.laz)
  const vlrMap = await Promise.all(
    vlrs.map<Promise<VlrData>>(
      async ({
        userId: user_id,
        recordId: record_id,
        description,
        contentOffset,
        contentLength,
      }) => ({
        data: Buffer.from(
          await Las.Vlr.fetch(get, {
            contentOffset,
            contentLength,
          } as Las.Vlr),
        ).toString('base64'),
        description,
        record_id,
        user_id,
      }),
    ),
  )
  const [GeoKeyDirectoryTag, GeoDoubleParamsTag, GeoAsciiParamsTag] =
    vlrMap.reduce<
      [VlrData | undefined, VlrData | undefined, VlrData | undefined]
    >(
      (acc, vlr) => {
        if (vlr.user_id !== 'LASF_Projection') return acc
        if (vlr.record_id === 34735) acc[0] = vlr
        if (vlr.record_id === 34736) acc[1] = vlr
        if (vlr.record_id === 34737) acc[2] = vlr
        // console.log(acc)
        return acc
      },
      [undefined, undefined, undefined],
    )
  // console.log(GeoKeyDirectoryTag)
  if (!GeoKeyDirectoryTag) throw new Error('Error retrieving GeoTIFF VLRs')

  expect(
    parseGeoTiff(
      Binary.toDataView(Buffer.from(GeoKeyDirectoryTag.data, 'base64')),
      GeoAsciiParamsTag && Buffer.from(GeoAsciiParamsTag.data, 'base64'),
      GeoDoubleParamsTag && Buffer.from(GeoDoubleParamsTag.data, 'base64'),
    ),
  ).toBe(
    'Geotiff_Information:\n   Version: 1\n   Key_Revision: 1.0\n   Tagged_Information:\n      End_Of_Tags.\n   Keyed_Information:\n      GTModelTypeGeoKey (Short,1): ModelTypeProjected\n      GTRasterTypeGeoKey (Short,1): RasterPixelIsArea\n      GTCitationGeoKey (Ascii,25): "WGS 84 / Pseudo-Mercator"\n      GeogCitationGeoKey (Ascii,7): "WGS 84"\n      GeogAngularUnitsGeoKey (Short,1): Angular_Degree\n      ProjectedCSTypeGeoKey (Short,1): Code-3857\n      ProjLinearUnitsGeoKey (Short,1): Linear_Meter\n     End_Of_Keys.\n   End_Of_Geotiff.\n',
  )
})
