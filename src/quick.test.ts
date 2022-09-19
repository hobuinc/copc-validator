import { ellipsoidFilename } from 'test'
import { Copc } from 'copc'
import QuickScan from './quick'

const filename = ellipsoidFilename

test('quick ferry-copc-data', async () => {
  const copc = await Copc.create(filename)
  const quick = await QuickScan(filename)

  expect(quick.name).toEqual(filename)
  expect(quick.header).toEqual(copc.header)
  expect(quick.vlrs).toEqual(copc.vlrs)
  expect(quick.info).toEqual(copc.info)
  expect(quick.scan.start <= quick.scan.end).toBe(true)

  const reportName = 'report'
  const quickWithName = await QuickScan(filename, reportName)
  expect(quickWithName.name).toEqual(reportName)
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
