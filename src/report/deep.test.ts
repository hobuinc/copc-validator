import { ellipsoidFiles, getLasItems } from 'test'
import { Copc } from 'copc'
import deepScan from './deep'
import { Report } from 'types'

const filename = ellipsoidFiles.copc

test('deep COPC-file', async () => {
  const copc = await Copc.create(filename)
  const deep = (await deepScan(filename)) as Report.SuccessCopc
  expect(Report.isCopc(deep)).toBe(true)
  expect(Report.isFail(deep)).toBe(false)

  expect(deep.name).toEqual(filename)
  expect(deep.scan.type).toEqual('deep')
  expect(deep.scan.filetype).toEqual('COPC')
  expect(deep.copc.header).toEqual(copc.header)
  expect(deep.copc.vlrs).toEqual(copc.vlrs)
  expect(deep.copc.info).toEqual(copc.info)
  expect(deep.scan.start <= deep.scan.end).toBe(true)

  const reportName = 'report'
  const deepWithName = await deepScan(filename, reportName)
  expect(deepWithName.name).toEqual(reportName)
})

test('deep las-file', async () => {
  const { header, vlrs } = await getLasItems()
  const deep = (await deepScan(ellipsoidFiles.laz14)) as Report.SuccessLas
  expect(Report.isLas(deep)).toBe(true)

  expect(deep.name).toEqual(ellipsoidFiles.laz14)
  expect(deep.scan.filetype).toEqual('LAS')
  expect(deep.las.header).toEqual(header)
  expect(deep.las.vlrs).toEqual(vlrs)
})

// Perform scan on *this* file to ensure total failure
test('deep non-las-file', async () => {
  const deep = (await deepScan(__filename)) as Report.Failure
  expect(Report.isCopc(deep)).toBe(false)
  expect(Report.isFail(deep)).toBe(true)

  expect(deep.name).toEqual(__filename)
  expect(deep.scan.type).toEqual('deep')
  expect(deep.scan.filetype).toEqual('Unknown')
  expect(deep.error.message).toContain('Invalid file signature:')
  // copcError undefined since both lasError & copcError fail for same reason
  expect(deep.copcError).toBeUndefined()
})
