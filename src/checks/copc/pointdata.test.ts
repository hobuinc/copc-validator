import { invokeAllChecks, findCheck } from 'checks'
import { enhancedHierarchyNodes, getNodePoint } from './common'
import { Copc, Getter } from 'copc'
import { ellipsoidFiles, getCopcItems } from 'test'
import shallowNodeScan, {
  pointData,
  reduceDimensions,
  getBadPoints,
  reducedPointData,
  getReducedBadPoints,
  pointChecker,
} from './pointdata'
import { omit, reduce } from 'lodash'

const items = getCopcItems()

test('shallowNodeScan all-pass', async () => {
  const { get, copc } = await items
  const checks = await invokeAllChecks({
    source: { get, copc },
    suite: shallowNodeScan,
  })
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})

test('shallowNodeScan failures', async () => {
  const checks = await invokeAllChecks({
    source: { get: Getter.create(ellipsoidFiles.laz14), copc: {} as Copc },
    suite: shallowNodeScan,
  })
  checks.forEach((check) => expect(check).not.toHaveProperty('status', 'pass'))
})

test('pd all-pass', async () => {
  const { get, copc, nodes } = await items
  const pd = enhancedHierarchyNodes(nodes, await getNodePoint(get, copc, nodes))
  const checks = await invokeAllChecks({
    source: { copc, pd },
    suite: pointData,
  })
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})

test('pd pdrf=6', async () => {
  const { get, copc, nodes } = await items
  // create known-good Copc file with pdrf=6
  const pdrf6Copc: Copc = {
    ...copc,
    header: {
      ...copc.header,
      pointDataRecordFormat: 6,
    },
  }
  const pd = enhancedHierarchyNodes(nodes, await getNodePoint(get, copc, nodes))
  const nonRgbPd: enhancedHierarchyNodes = reduce(
    pd,
    (prev, curr, path) => ({
      ...prev,
      [path]: {
        ...curr,
        root: {
          ...omit(curr.root, 'Red', 'Green', 'Blue'),
        },
      },
    }),
    {},
  )
  const checks = await invokeAllChecks({
    source: { copc: pdrf6Copc, pd: nonRgbPd },
    suite: pointData,
  })
  // all-pass with known-good Copc file turned into pdrf=6 version
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))

  // create outdated Copc objects with pdrf=6
  const {
    get: oldGet,
    copc: oldCopc,
    nodes: oldNodes,
  } = await getCopcItems(ellipsoidFiles.oldCopc)
  const oldPd = enhancedHierarchyNodes(
    oldNodes,
    await getNodePoint(oldGet, oldCopc, oldNodes),
  )
  const badOldCopc = {
    ...oldCopc,
    header: {
      ...oldCopc.header,
      pointDataRecordFormat: 6,
    },
  }
  const oldNonRgbChecks = await invokeAllChecks({
    source: { copc: badOldCopc, pd: oldPd },
    suite: pointData,
  })
  // check for pdrf=6 failures with outdated Copc file
  expect(findCheck(oldNonRgbChecks, 'rgb')).toHaveProperty('status', 'fail')
  expect(findCheck(oldNonRgbChecks, 'rgbi')).toHaveProperty(
    'info',
    expect.stringContaining('Intensity'),
  )
})

test('pd failures', async () => {
  const { get, copc, nodes } = await items
  const pd = enhancedHierarchyNodes(nodes, await getNodePoint(get, copc, nodes))
  // Creating point data with no dimensions to ensure complete failure of the suite
  const badPd: enhancedHierarchyNodes = reduce(
    pd,
    (prev, curr, path) => ({ ...prev, [path]: { ...curr, root: {} } }),
    {},
  )
  const checks = await invokeAllChecks({
    source: { copc, pd: badPd },
    suite: pointData,
  })
  checks.forEach((check) => expect(check).not.toHaveProperty('status', 'pass'))

  const {
    get: oldGet,
    copc: oldCopc,
    nodes: oldNodes,
  } = await getCopcItems(ellipsoidFiles.oldCopc)
  // the original ellipsoid.copc.laz file had bad RGB and gpsTime data, so I'm
  // testing for those checks here
  const oldPd = enhancedHierarchyNodes(
    oldNodes,
    await getNodePoint(oldGet, oldCopc, oldNodes),
  )
  const oldChecks = await invokeAllChecks({
    source: { copc: oldCopc, pd: oldPd },
    suite: pointData,
  })
  expect(findCheck(oldChecks, 'gpsTime')).toHaveProperty('status', 'fail')
  expect(findCheck(oldChecks, 'rgbi')).toHaveProperty('status', 'warn')
})

test('pd utilities', async () => {
  const { get, copc, nodes } = await items
  const pd = enhancedHierarchyNodes(nodes, await getNodePoint(get, copc, nodes))

  // If no dimensions can be found on pd.root, reduceDimensions() returns `{}`
  const emptyDimensionTests = [[], ['NonExistentDimension']]
  emptyDimensionTests.forEach((dim) => {
    const reducedPd = reduceDimensions(pd, dim)
    // console.log(reducedPd)
    for (const path in reducedPd) {
      expect(reducedPd[path]).toEqual({})
    }
  })

  // If some of the dimensions can be found, they will be returned by reduceDimensions
  const reducedPd = reduceDimensions(pd, [
    'X',
    'Y',
    'Z',
    'NonExistentDimension',
  ])
  for (const path in reducedPd) {
    expect(nodes[path]).toBeDefined()
    expect(reducedPd[path]).toEqual({
      X: pd[path].root.X,
      Y: pd[path].root.Y,
      Z: pd[path].root.Z,
    })
  }

  const badCheck: pointChecker = (d) => {
    throw new Error('Bad Check')
  }
  const badPoints = getBadPoints(pd, badCheck)
  const badReducedPoints = getReducedBadPoints(reducedPd, badCheck)
  const allNodes = Object.keys(nodes)
  expect(badPoints).toEqual(allNodes)
  expect(badReducedPoints).toEqual(allNodes)
  expect(
    getBadPoints(pd, (d) => d.X! !== 0 || d.Y! !== 0 || d.Z! !== 0),
  ).toEqual(allNodes)
})

// I realized reduceDimensions wasn't actually *doing* anything internally for
// the point-data.ts check functions, and I used this test to confirm that calling
// it was actually detrimental to overall performance. Can still be useful for logging
// and for isEqual() object checks so I won't remove the old functions (yet), plus
// I figured this test may be interesting to see/replicate
// Interestingly, the results are not entirely consistent; this test randomly fails
test('getBadPoints performance test', async () => {
  const { get, copc, nodes } = await items
  const pd = enhancedHierarchyNodes(nodes, await getNodePoint(get, copc, nodes))
  const check: pointChecker = (d) =>
    typeof d.X === 'undefined' ||
    typeof d.Y === 'undefined' ||
    typeof d.Z === 'undefined'
  const { f, g } = averagePerformance(
    () => getReducedBadPoints(reduceDimensions(pd, ['X', 'Y', 'Z']), check),
    () => getBadPoints(pd, check),
    10,
  )

  expect(f).toBeGreaterThan(g)
})

test.todo('other pointData tests')

const comparePerformance = (
  f: () => unknown,
  g: () => unknown,
): { f: number; g: number } => {
  const start = performance.now()
  f()
  const mid = performance.now()
  g()
  const end = performance.now()
  return { f: mid - start, g: end - mid }
}
const averagePerformance = (f: () => unknown, g: () => unknown, n = 10) => {
  const performances = Array.from(new Array(n), () => comparePerformance(f, g))
  // console.log(performances)
  const sum = performances.reduce((prev, curr) => ({
    f: prev.f + curr.f,
    g: prev.g + curr.g,
  }))
  // console.log(sum)
  return { f: sum.f / n, g: sum.g / n }
}
