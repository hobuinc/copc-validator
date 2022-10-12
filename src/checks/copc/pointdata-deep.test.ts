import { invokeAllChecks } from 'checks'
import { Copc, Getter } from 'copc'
import { ellipsoidFiles, getCopcItems } from 'test'
import deepNodeScan, { getNodePoints, getBadNodes } from './pointdata-deep'

const items = getCopcItems()

test('deepNodeScan all-pass', async () => {
  const { get, copc } = await items
  const checks = await invokeAllChecks({
    source: { get, copc },
    suite: deepNodeScan,
  })
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
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

test('getNodePoints', async () => {
  const { get, copc, nodes } = await items
  const nodePoints = await getNodePoints(get, copc, nodes) //nodeAllPoints as NodePoints[]
  // length matches the original `nodes` object
  expect(nodePoints).toHaveLength(Object.entries(nodes).length)
  nodePoints.forEach((node) => {
    // each `path` corresponds to a valid node in the nodes map
    expect(nodes[node.key]).toBeDefined()
    // each `points` array contains the correct number of points
    expect(node.points).toHaveLength(nodes[node.key]?.pointCount!)
  })
})

test('getBadNodes', async () => {
  const { get, copc, nodes } = await items
  const nodePoints = await getNodePoints(get, copc, nodes)
  const badNodes = getBadNodes(nodePoints, (_p) => {
    throw new Error('')
  })
  expect(badNodes).toEqual(Object.keys(nodes))
})
