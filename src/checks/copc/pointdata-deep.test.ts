import { invokeAllChecks } from 'checks/utils'
import { Copc, Getter } from 'copc'
import { ellipsoidFiles, getCopcItems } from 'test'
import deepNodeScan from './pointdata-deep'

const items = getCopcItems()

test('deepNodeScan all-pass', async () => {
  const { get, copc } = await items
  const checks = await invokeAllChecks({
    source: { get, copc },
    suite: deepNodeScan,
  })
  expect(checks).toEqual([{ id: 'deep-nodeScan.NS', status: 'pass' }])
})

test('deepNodeScan failures', async () => {
  const checks = await invokeAllChecks({
    source: { get: Getter.create(ellipsoidFiles.laz14), copc: {} as Copc },
    suite: deepNodeScan,
  })
  expect(checks).toEqual([
    { id: 'deep-nodeScan.NS', status: 'fail', info: expect.any(String) },
  ])
})
