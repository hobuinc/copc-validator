import { ellipsoidFilename } from 'test'
import { Copc } from 'copc'
import QuickScan from './quick'
import { Report } from 'types'

const filename = ellipsoidFilename

test('quick ferry-copc-data', async () => {
  const copc = await Copc.create(filename)
  const quick = (await QuickScan(filename)) as Report.SuccessCopc
  expect(Report.isCopc(quick)).toBe(true)
  expect(Report.isFail(quick)).toBe(false)

  expect(quick.name).toEqual(filename)
  expect(quick.scan.type).toEqual('quick')
  expect(quick.scan.result).toEqual('COPC')
  expect(quick.copc.header).toEqual(copc.header)
  expect(quick.copc.vlrs).toEqual(copc.vlrs)
  expect(quick.copc.info).toEqual(copc.info)
  expect(quick.scan.start <= quick.scan.end).toBe(true)

  const reportName = 'report'
  const quickWithName = await QuickScan(filename, reportName)
  expect(quickWithName.name).toEqual(reportName)
})

// Perform scan on *this* file to ensure failure
test('quick non-copc-file', async () => {
  const quick = (await QuickScan(__filename)) as Report.Failed
  expect(Report.isCopc(quick)).toBe(false)
  expect(Report.isFail(quick)).toBe(true)

  expect(quick.name).toEqual(__filename)
  expect(quick.scan.type).toEqual('quick')
  expect(quick.scan.result).toEqual('Unknown')
  expect(quick.error.message).toContain('Invalid file signature:')
})

// TODO: Figure out how to test bad COPC with file input for scan
// Options
//   1. Create a bad COPC file
//   2. Ignore it, handle bad COPC checks in src/checks/*.test.ts

// test('quick header fail', async () => {
//   const copc = await Copc.create(filename)
//   const badCopc: Copc = {
//     ...copc,
//     header: {
//       ...copc.header,
//       minorVersion: 3,
//     },
//   }
//   const quick = QuickScan(badCopc, filename)
//   const majorVersionStatus = quick.checks.find(
//     (c) => c.id === 'header.majorVersion',
//   )!.status
//   const minorVersionStatus = quick.checks.find(
//     (c) => c.id === 'header.minorVersion',
//   )!.status

//   expect(majorVersionStatus).toBe('pass')
//   expect(minorVersionStatus).toBe('fail')
// })
