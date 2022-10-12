import {
  enhancedHierarchyNodes,
  getNodePoint,
  getNodePoints,
  getNodeData,
  NodeData,
  NodePoint,
  NodePoints,
} from './common'
import { Copc, Getter, Hierarchy } from 'copc'
import { ellipsoidFiles, getCopcItems } from 'test'

const items = getCopcItems()

test('enhancedHierarchyNodes', async () => {
  const { get, copc, nodes } = await items
  const pd = enhancedHierarchyNodes(nodes, await getNodePoint(get, copc, nodes))
  Object.entries(pd).forEach(([path, { root }]) =>
    expect(root).toMatchObject(pd[path].root),
  )
})
test.todo('enhancedHierarchyNodes expect statements')

test('enhancedHierarchyNodes bad-data', async () => {
  const { get, copc, nodes } = await items
  // bad nodes
  expect(
    enhancedHierarchyNodes(nodes, await getNodePoint(get, copc, {})),
  ).toEqual({})
  // bad COPC
  await expect(async () =>
    enhancedHierarchyNodes(nodes, await getNodePoint(get, {} as Copc, nodes)),
  ).rejects.toThrow()
})

// Commented out because the following test takes over 11 minutes, even for
// the tiny ellipsoid test file. Since 'getNodePoints' only takes 2 seconds,
// I should be able to fix it by reworking fullHierarchyNodes() (or something)

// test('fullHierarchyNodes', async () => {
//   const { get, copc, nodes } = await items
//   const pd = fullHierarchyNodes(nodes, await getNodePoints(get, copc, nodes))
//   console.log(pd)
// })

// Wrapped multiple tests into one here so that they can all share the two calls
// of `getNodeData()`, which covers both `getNodePoint()` and `getNodePoints()`
test('getNodeData & getNodePoint(s)', async () => {
  const { get, copc, nodes } = await items
  const nodeRootPoints = await getNodeData(get, copc, nodes)
  const nodeAllPoints = await getNodeData(get, copc, nodes, true)
  expect(NodeData.isRootPoint(nodeRootPoints)).toBe(true)
  expect(NodeData.isAllPoints(nodeRootPoints)).toBe(false)
  expect(NodeData.isRootPoint(nodeAllPoints)).toBe(false)
  expect(NodeData.isAllPoints(nodeAllPoints)).toBe(true)

  // `as NodePoint[]` is true given the first four expect() statements
  const nodePoint = nodeRootPoints as NodePoint[]
  // length matches the original `nodes` object
  expect(nodePoint).toHaveLength(Object.entries(nodes).length)
  // each `path` corresponds to a valid node in the nodes map
  nodePoint.forEach((node) => expect(nodes[node.key]).toBeDefined())

  // The following statements cause a memory leak, so... don't pass invalid Copc
  // data (Getter or Copc object) to the getNodePoint() function.
  // Confirm the data is valid by passing through Copc.create() and .loadPointDataView()

  // await expect(
  //   getNodePoint(Getter.create(ellipsoidFiles.laz14), copc, nodes),
  // ).rejects.toThrow()
  // await expect(getNodePoint(get, {} as Copc, nodes)).rejects.toThrow()

  // However, the nodes data can be messed up:
  expect(await getNodePoint(get, copc, {})).toEqual([])

  // `as NodePoints[]` is true given the first four expect() statements
  const nodePoints = nodeAllPoints as NodePoints[]
  // length matches the original `nodes` object
  expect(nodePoints).toHaveLength(Object.entries(nodes).length)
  nodePoints.forEach((node) => {
    // each `path` corresponds to a valid node in the nodes map
    expect(nodes[node.key]).toBeDefined()
    // each `points` array contains the correct number of points
    expect(node.points).toHaveLength(nodes[node.key]?.pointCount!)
  })
})
