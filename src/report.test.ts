import generateReport from 'report'
import { ellipsoidFiles, getCopcItems, getLasItems } from 'test'
import { Report } from 'types'

const copcFile = ellipsoidFiles.copc
const copcItems = getCopcItems()
const lasItems = getLasItems()

test('shallow COPC', async () => {
  const { copc } = await copcItems
  const shallow = await generateReport(copcFile, {}) // default parameters
  expect(Report.isCopc(shallow)).toBe(true)
  // given this check, the throw below should be unnecessary, but TS doesn't understand
  expect(Report.isFail(shallow)).toBe(false)

  expect(shallow.name).toEqual(copcFile)
  expect(shallow.scan.type).toEqual('shallow')
  expect(shallow.scan.filetype).toEqual('COPC')

  if (!Report.isCopc(shallow))
    throw new Error('generateReport() created the wrong Report.filetype')
  expect(shallow.copc.header).toEqual(copc.header)
  expect(shallow.copc.vlrs).toEqual(copc.vlrs)
  expect(shallow.copc.info).toEqual(copc.info)
  expect(shallow.scan.start <= shallow.scan.end).toBe(true)

  const reportName = 'report'
  const shallowWithName = await generateReport(copcFile, { name: reportName }) // default `deep`
  expect(shallowWithName.name).toEqual(reportName)
})

test('shallow LAS', async () => {
  const { header, vlrs } = await lasItems
  const shallow = await generateReport(ellipsoidFiles.laz14, { deep: false }) // default `name`
  expect(Report.isLas(shallow)).toBe(true)
  expect(Report.isCopc(shallow)).toBe(false)
  expect(Report.isFail(shallow)).toBe(false)

  expect(shallow.name).toEqual(ellipsoidFiles.laz14)
  expect(shallow.scan.filetype).toEqual('LAS')
  if (!Report.isLas(shallow))
    throw new Error('generateReport() created the wrong Report.filetype')
  expect(shallow.las.header).toEqual(header)
  expect(shallow.las.vlrs).toEqual(vlrs)
})

test('shallow Unknown', async () => {
  const shallow = await generateReport(__filename, {
    name: __filename,
    deep: false,
  }) // default parameters but provided
  expect(Report.isCopc(shallow)).toBe(false)
  expect(Report.isFail(shallow)).toBe(true)

  expect(shallow.name).toEqual(__filename)
  expect(shallow.scan.type).toEqual('shallow')
  expect(shallow.scan.filetype).toEqual('Unknown')
  if (!Report.isFail(shallow))
    throw new Error('generateReport() created the wrong Report.filetype')
  expect(shallow.error.message).toContain('Invalid file signature:')
  // copcError undefined since both lasError & copcError fail for same reason
  expect(shallow.copcError).toBeUndefined()
})

test('deep COPC', async () => {
  const { copc } = await copcItems
  const deep = await generateReport(copcFile, { deep: true }) // default parameters
  expect(Report.isCopc(deep)).toBe(true)
  // given this check, the throw below should be unnecessary, but TS doesn't understand
  expect(Report.isFail(deep)).toBe(false)

  expect(deep.name).toEqual(copcFile)
  expect(deep.scan.type).toEqual('deep')
  expect(deep.scan.filetype).toEqual('COPC')

  if (!Report.isCopc(deep))
    throw new Error('generateReport() created the wrong Report.filetype')
  expect(deep.copc.header).toEqual(copc.header)
  expect(deep.copc.vlrs).toEqual(copc.vlrs)
  expect(deep.copc.info).toEqual(copc.info)
  expect(deep.scan.start <= deep.scan.end).toBe(true)

  const reportName = 'report'
  const deepWithName = await generateReport(copcFile, {
    name: reportName,
    deep: true,
  })
  expect(deepWithName.name).toEqual(reportName)
})

test('deep LAS', async () => {
  const { header, vlrs } = await lasItems
  const deep = await generateReport(ellipsoidFiles.laz14, { deep: true }) // default `name`
  expect(Report.isLas(deep)).toBe(true)
  expect(Report.isCopc(deep)).toBe(false)
  expect(Report.isFail(deep)).toBe(false)

  expect(deep.name).toEqual(ellipsoidFiles.laz14)
  expect(deep.scan.filetype).toEqual('LAS')
  expect(deep.scan.type).toEqual('deep')
  if (!Report.isLas(deep))
    throw new Error('generateReport() created the wrong Report.filetype')
  expect(deep.las.header).toEqual(header)
  expect(deep.las.vlrs).toEqual(vlrs)
})

test('deep Unknown', async () => {
  const deep = await generateReport(ellipsoidFiles.fake, {
    name: ellipsoidFiles.fake,
    deep: true,
  }) // default parameters but provided
  expect(Report.isCopc(deep)).toBe(false)
  expect(Report.isFail(deep)).toBe(true)

  expect(deep.name).toEqual(ellipsoidFiles.fake)
  expect(deep.scan.type).toEqual('deep')
  expect(deep.scan.filetype).toEqual('Unknown')
  if (!Report.isFail(deep))
    throw new Error('generateReport() created the wrong Report.filetype')
  expect(deep.error.message).toContain('Invalid header:')
  // copcError undefined since both lasError & copcError fail for same reason
  expect(deep.copcError).toBeUndefined()
})
