import { ellipsoidFilename } from 'test'
import { Copc } from 'copc'
import QuickScan from './quick'

const filename = ellipsoidFilename

test('quick header all-pass', async () => {
  const copc = await Copc.create(filename)
  const quick = QuickScan(copc, filename)

  expect(quick.header).toEqual(copc.header)
  expect(quick.vlrs).toEqual(copc.vlrs)
  expect(quick.info).toEqual(copc.info)
  expect(quick.scan.start <= quick.scan.end).toBe(true)
  expect(quick.file).toEqual(filename)
})

test('quick no-filename', async () => {
  const copc = await Copc.create(filename)
  const quick = QuickScan(copc)

  expect(quick.file).toEqual('undefined')
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
  const majorVersionStatus = quick.checks.find((c) => c.id === 1)!.status
  const minorVersionStatus = quick.checks.find((c) => c.id === 2)!.status

  expect(majorVersionStatus).toBe('pass')
  expect(minorVersionStatus).toBe('fail')
})
