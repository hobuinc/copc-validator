import { ellipsoidFiles, getLasItems } from 'test'
import { Copc } from 'copc'
import QuickScan from './quick'
import { Report } from 'types'

const filename = ellipsoidFiles.copc

test('quick COPC-file', async () => {
  const copc = await Copc.create(filename)
  const quick = (await QuickScan(filename)) as Report.SuccessCopc
  expect(Report.isCopc(quick)).toBe(true)
  expect(Report.isFail(quick)).toBe(false)

  expect(quick.name).toEqual(filename)
  expect(quick.scan.type).toEqual('quick')
  expect(quick.scan.filetype).toEqual('COPC')
  expect(quick.scan.result).toEqual('valid')
  expect(quick.copc.header).toEqual(copc.header)
  expect(quick.copc.vlrs).toEqual(copc.vlrs)
  expect(quick.copc.info).toEqual(copc.info)
  expect(quick.scan.start <= quick.scan.end).toBe(true)

  const reportName = 'report'
  const quickWithName = await QuickScan(filename, reportName)
  expect(quickWithName.name).toEqual(reportName)
})

test('quick las-file', async () => {
  const { header, vlrs } = await getLasItems()
  const quick = (await QuickScan(ellipsoidFiles.laz14)) as Report.SuccessLas
  expect(Report.isLas(quick)).toBe(true)

  expect(quick.name).toEqual(ellipsoidFiles.laz14)
  expect(quick.scan.filetype).toEqual('LAS')
  expect(quick.scan.result).toEqual('invalid')
  expect(quick.las.header).toEqual(header)
  expect(quick.las.vlrs).toEqual(vlrs)
})

// Perform scan on *this* file to ensure total failure
test('quick non-las-file', async () => {
  const quick = (await QuickScan(__filename)) as Report.Failure
  expect(Report.isCopc(quick)).toBe(false)
  expect(Report.isFail(quick)).toBe(true)

  expect(quick.name).toEqual(__filename)
  expect(quick.scan.type).toEqual('quick')
  expect(quick.scan.filetype).toEqual('Unknown')
  expect(quick.scan.result).toEqual('NA')
  expect(quick.copcError!.message).toContain('Invalid file signature:')
  expect(quick.error!.message).toContain('Invalid file signature:')
})
