import { ellipsoidFilename } from 'test'
import { Copc } from 'copc'
import QuickScan from './quick'

const filename = ellipsoidFilename

test('quick ferry-copc-data', async () => {
  const copc = await Copc.create(filename)
  const quick = QuickScan(copc, filename)

  expect(quick.file).toEqual(filename)
  expect(quick.header).toEqual(copc.header)
  expect(quick.vlrs).toEqual(copc.vlrs)
  expect(quick.info).toEqual(copc.info)
  expect(quick.scan.start <= quick.scan.end).toBe(true)

  const quickNoName = QuickScan(copc)
  expect(quickNoName.file).toEqual('undefined')
})

test('quick header fail', async () => {
  const copc = await Copc.create(filename)
  const badCopc: Copc = {
    ...copc,
    header: {
      ...copc.header,
      minorVersion: 3,
    },
  }
  const quick = QuickScan(badCopc, filename)
  const majorVersionStatus = quick.checks.find(
    (c) => c.id === 'header.majorVersion',
  )!.status
  const minorVersionStatus = quick.checks.find(
    (c) => c.id === 'header.minorVersion',
  )!.status

  expect(majorVersionStatus).toBe('pass')
  expect(minorVersionStatus).toBe('fail')
})
