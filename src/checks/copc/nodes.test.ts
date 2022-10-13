import { invokeAllChecks } from 'checks'
import { Copc, Getter } from 'copc'
import { ellipsoidFiles, getCopcItems } from 'test'
import nodeScanSuite, { nodeScan, readHierarchyNodes, scanNodes } from './nodes'
import { enhancedNodeMap } from './pointdata'

const items = getCopcItems()

test('shallowNodeScan all-pass', async () => {
  const { get, copc } = await items
  const checks = await invokeAllChecks({
    source: { get, copc, deep: false },
    suite: nodeScanSuite,
  })
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})

test('shallowNodeScan failures', async () => {
  const checks = await invokeAllChecks({
    source: {
      get: Getter.create(ellipsoidFiles.laz14),
      copc: {} as Copc,
      deep: false,
    },
    suite: nodeScanSuite,
  })
  // checks.forEach((check) => expect(check).not.toHaveProperty('status', 'pass'))
  expect(checks).toEqual([
    {
      id: 'pointData-NestedSuite',
      status: 'fail',
      info: "Cannot read properties of undefined (reading 'rootHierarchyPage')",
    },
  ])
})

test('deepNodeScan all-pass', async () => {
  const { get, copc } = await items
  const checks = await invokeAllChecks({
    source: { get, copc, deep: true },
    suite: nodeScanSuite,
  })
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})
test('deepNodeScan failures', async () => {
  const checks = await invokeAllChecks({
    source: {
      get: Getter.create(ellipsoidFiles.laz14),
      copc: {} as Copc,
      deep: true,
    },
    suite: nodeScanSuite,
  })
  // checks.forEach((check) => expect(check).not.toHaveProperty('status', 'pass'))
  expect(checks).toEqual([
    {
      id: 'deep.pointData-NestedSuite',
      status: 'fail',
      info: "Cannot read properties of undefined (reading 'rootHierarchyPage')",
    },
  ])
})

test('readHierarchyNodes', async () => {
  const { get, copc, nodes } = await items
  const shallowMap = await readHierarchyNodes(get, copc, nodes, false)
  expect(enhancedNodeMap.isShallowMap(shallowMap)).toBe(true)
  expect(enhancedNodeMap.isDeepMap(shallowMap)).toBe(false)
  const deepMap = await readHierarchyNodes(get, copc, nodes, true)
  expect(enhancedNodeMap.isDeepMap(deepMap)).toBe(true)
  expect(enhancedNodeMap.isShallowMap(deepMap)).toBe(false)
})

test('scanNodes', async () => {
  const { get, copc, nodes } = await items
  const shallowNodes = await scanNodes(get, copc, nodes, false)
  expect(nodeScan.isShallowNodeScan(shallowNodes)).toBe(true)
  expect(nodeScan.isDeepNodeScan(shallowNodes)).toBe(false)
  expect(shallowNodes).toHaveLength(Object.entries(nodes).length)
  shallowNodes.forEach((node) => expect(nodes[node.key]).toBeDefined())
  const deepNodes = await scanNodes(get, copc, nodes, true)
  expect(nodeScan.isDeepNodeScan(deepNodes)).toBe(true)
  expect(nodeScan.isShallowNodeScan(deepNodes)).toBe(false)
  expect(deepNodes).toHaveLength(Object.entries(nodes).length)
  deepNodes.forEach((node) => expect(nodes[node.key]).toBeDefined())

  // The following statements cause a memory leak, so... don't pass invalid Copc
  // data (Getter or Copc object) to the getNodePoint() function.
  // Confirm the data is valid by passing through Copc.create() and .loadPointDataView()
  /* await expect(
    getNodePoint(Getter.create(ellipsoidFiles.laz14), copc, nodes),
  ).rejects.toThrow() */
  /* await expect(getNodePoint(get, {} as Copc, nodes)).rejects.toThrow() */

  // However, the nodes data can be messed up:
  expect(await scanNodes(get, copc, {}, false)).toEqual([])
})
