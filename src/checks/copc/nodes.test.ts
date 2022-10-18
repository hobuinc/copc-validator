import { invokeAllChecks } from 'checks'
import { Copc, Getter } from 'copc'
import { resolve } from 'path'
import Piscina from 'piscina'
import { ellipsoidFiles, getCopcItems } from 'test'
import nodeScanSourcer, {
  nodeScan,
  readHierarchyNodes,
  scanNodes,
} from './nodes'
import { enhancedNodeMap } from './pointdata'

const maxThreads: number | undefined = undefined
const items = getCopcItems()

test('shallowNodeScan all-pass', async () => {
  const { filepath, get, copc } = await items
  const checks = await invokeAllChecks(
    await nodeScanSourcer(get, copc, filepath), //default parameters
  )
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})

test('shallowNodeScan failures', async () => {
  const filename = ellipsoidFiles.laz14
  const get = Getter.create(filename)
  const copc = {} as Copc

  await expect(
    nodeScanSourcer(get, copc, filename, false, maxThreads),
  ).rejects.toThrow('Cannot read properties of undefined')

  // const checks = await invokeAllChecks(
  //   await nodeScanSourcer(get, copc, filename, false, maxThreads),
  // )
  // checks.forEach((check) => expect(check).not.toHaveProperty('status', 'pass'))
  // expect(checks).toEqual([
  //   {
  //     id: 'pointData-NestedSuite',
  //     status: 'fail',
  //     info: "Cannot read properties of undefined (reading 'rootHierarchyPage')",
  //   },
  // ])
})

test('deepNodeScan all-pass', async () => {
  const { filepath, get, copc } = await items
  const checks = await invokeAllChecks(
    await nodeScanSourcer(get, copc, filepath, true, maxThreads),
  )
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})
test('deepNodeScan failures', async () => {
  const filename = ellipsoidFiles.laz14
  const get = Getter.create(filename)
  const copc = {} as Copc

  await expect(
    nodeScanSourcer(get, copc, filename, true, maxThreads),
  ).rejects.toThrow('Cannot read properties of undefined')

  // const checks = await invokeAllChecks(
  //   await nodeScanSourcer(get, copc, filename, true, maxThreads),
  // )
  // checks.forEach((check) => expect(check).not.toHaveProperty('status', 'pass'))
  // expect(checks).toEqual([
  //   {
  //     id: 'deep.pointData-NestedSuite',
  //     status: 'fail',
  //     info: "Cannot read properties of undefined (reading 'rootHierarchyPage')",
  //   },
  // ])
})

test('readHierarchyNodes', async () => {
  const { filepath, nodes } = await items
  const shallowMap = await readHierarchyNodes(
    nodes,
    filepath,
    false,
    maxThreads,
  )
  expect(enhancedNodeMap.isShallowMap(shallowMap)).toBe(true)
  expect(enhancedNodeMap.isDeepMap(shallowMap)).toBe(false)
  const deepMap = await readHierarchyNodes(nodes, filepath, true, maxThreads) //get, copc, nodes, true)
  expect(enhancedNodeMap.isDeepMap(deepMap)).toBe(true)
  expect(enhancedNodeMap.isShallowMap(deepMap)).toBe(false)
})

test('scanNodes', async () => {
  const { filepath, nodes } = await items
  const piscina = new Piscina({
    filename: resolve(__dirname, 'worker.js'),
    maxThreads: maxThreads,
    idleTimeout: 100,
  })
  const shallowNodes = await scanNodes(nodes, filepath, piscina, false)
  expect(nodeScan.isShallowNodeScan(shallowNodes)).toBe(true)
  expect(nodeScan.isDeepNodeScan(shallowNodes)).toBe(false)
  expect(shallowNodes).toHaveLength(Object.entries(nodes).length)
  shallowNodes.forEach((node) => expect(nodes[node.key]).toBeDefined())
  const deepNodes = await scanNodes(nodes, filepath, piscina, true)
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
  expect(await scanNodes({}, filepath, piscina, false)).toEqual([])
})
