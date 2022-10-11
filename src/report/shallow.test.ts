import { ellipsoidFiles, getLasItems } from 'test'
import { Copc } from 'copc'
import shallowScan from './shallow'
import { Report } from 'types'

const filename = ellipsoidFiles.copc

test('shallow COPC-file', async () => {
  const copc = await Copc.create(filename)
  const shallow = (await shallowScan(filename)) as Report.SuccessCopc
  expect(Report.isCopc(shallow)).toBe(true)
  expect(Report.isFail(shallow)).toBe(false)

  expect(shallow.name).toEqual(filename)
  expect(shallow.scan.type).toEqual('shallow')
  expect(shallow.scan.filetype).toEqual('COPC')
  expect(shallow.copc.header).toEqual(copc.header)
  expect(shallow.copc.vlrs).toEqual(copc.vlrs)
  expect(shallow.copc.info).toEqual(copc.info)
  expect(shallow.scan.start <= shallow.scan.end).toBe(true)

  const reportName = 'report'
  const shallowWithName = await shallowScan(filename, reportName)
  expect(shallowWithName.name).toEqual(reportName)
})

test('shallow las-file', async () => {
  const { header, vlrs } = await getLasItems()
  const shallow = (await shallowScan(ellipsoidFiles.laz14)) as Report.SuccessLas
  expect(Report.isLas(shallow)).toBe(true)

  expect(shallow.name).toEqual(ellipsoidFiles.laz14)
  expect(shallow.scan.filetype).toEqual('LAS')
  expect(shallow.las.header).toEqual(header)
  expect(shallow.las.vlrs).toEqual(vlrs)
})

// Perform scan on *this* file to ensure total failure
test('shallow non-las-file', async () => {
  const shallow = (await shallowScan(__filename)) as Report.Failure
  expect(Report.isCopc(shallow)).toBe(false)
  expect(Report.isFail(shallow)).toBe(true)

  expect(shallow.name).toEqual(__filename)
  expect(shallow.scan.type).toEqual('shallow')
  expect(shallow.scan.filetype).toEqual('Unknown')
  expect(shallow.error.message).toContain('Invalid file signature:')
  // copcError undefined since both lasError & copcError fail for same reason
  expect(shallow.copcError).toBeUndefined()
})
