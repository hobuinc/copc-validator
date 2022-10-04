import { invokeAllChecks } from 'checks/utils'
import { enhancedHierarchyNodes, getNodePoint } from './common'
import { Copc, Getter } from 'copc'
import { ellipsoidFiles } from 'test'
import pointData, {
  reduceDimensions,
  getBadPoints,
  reducedPointData,
  getReducedBadPoints,
} from './point-data'
import { omit, reduce } from 'lodash'
import { getItems } from './common.test'

jest.setTimeout(7500)

const items = getItems()

test('pd all-pass', async () => {
  const { get, copc, nodes } = await items
  const pd = enhancedHierarchyNodes(nodes, await getNodePoint(get, copc, nodes))
  const checks = await invokeAllChecks({
    source: { copc, pd },
    suite: pointData,
  })
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})

test('pd all-pass pdrf=6', async () => {
  const { get, copc, nodes } = await items
  const badCopc: Copc = {
    ...copc,
    header: {
      ...copc.header,
      pointDataRecordFormat: 6,
    },
  }
  // getNodePoint(get, badCopc, nodes) causes a memory leak???
  // const pd = enhancedHierarchyNodes(
  //   nodes,
  //   await getNodePoint(get, badCopc, nodes),
  // )
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
    source: { copc: badCopc, pd: nonRgbPd },
    suite: pointData,
  })
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})

test('pd critical-fail', async () => {
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
})

test('pd utilities', async () => {
  const { get, copc, nodes } = await items
  const pd = enhancedHierarchyNodes(nodes, await getNodePoint(get, copc, nodes))
  const reducedPd = reduceDimensions(pd, ['X', 'Y', 'Z'])
  expect(reducedPd).toMatchObject<reducedPointData>(
    reduce(
      pd,
      (prev, curr, path) => ({
        ...prev,
        [path]: {
          X: curr.root.X,
          Y: curr.root.Y,
          Z: curr.root.Z,
        },
      }),
      {},
    ),
  )

  const nonZeroXyzPoints = getBadPoints(
    pd,
    (d) => d.X! !== 0 || d.Y! !== 0 || d.Z! !== 0,
  )
  expect(nonZeroXyzPoints).toEqual(Object.keys(nodes))
})

const comparePerformance = (
  f: () => any,
  g: () => any,
): { f: number; g: number } => {
  const start = performance.now()
  f()
  const mid = performance.now()
  g()
  const end = performance.now()
  return { f: mid - start, g: end - mid }
}

// I realized reduceDimensions wasn't actually *doing* anything internally for
// the point-data.ts check functions, and I used this test to confirm that calling
// it was actually detrimental to overall performance. Can still be useful for logging
// and for isEqual() object checks so I won't remove the old functions (yet), plus
// I figured this test may be interesting to see/replicate
test('getBadPoints performance test', async () => {
  const { get, copc, nodes } = await items
  const pd = enhancedHierarchyNodes(nodes, await getNodePoint(get, copc, nodes))
  const check = (d: Record<string, number | undefined>) =>
    typeof d.X === 'undefined' ||
    typeof d.Y === 'undefined' ||
    typeof d.Z === 'undefined'
  const { f, g } = comparePerformance(
    () => {
      const reducedPd = reduceDimensions(pd, ['X', 'Y', 'Z'])
      return getReducedBadPoints(reducedPd, check)
    },
    () => getBadPoints(pd, check),
  )
  expect(f).toBeGreaterThan(g)
})

test.todo('other pointData tests')
