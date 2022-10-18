import { invokeAllChecks, findCheck } from 'checks'
import { Copc } from 'copc'
import { ellipsoidFiles, getCopcItems } from 'test'
import {
  pointData,
  shallowNodeMap,
  pointChecker,
  getBadNodes,
} from './pointdata'
import { omit, reduce } from 'lodash'
import { readHierarchyNodes } from './nodes'

const maxThreads: number | undefined = undefined
const items = getCopcItems()

test('getBadNodes', async () => {
  const { filepath, copc, nodes } = await items
  const {
    info: {
      gpsTimeRange: [gpsMin, gpsMax],
    },
  } = copc
  const shallowMap = await readHierarchyNodes(
    nodes,
    filepath,
    false,
    maxThreads,
  )
  const deepMap = await readHierarchyNodes(nodes, filepath, true, maxThreads)
  const rootCheck: pointChecker = (d) =>
    typeof d.GpsTime === 'undefined' || d.GpsTime < gpsMin || d.GpsTime > gpsMax

  const shallowNoNodes = getBadNodes(shallowMap, rootCheck)
  const deepNoNodes = getBadNodes(deepMap, rootCheck)

  expect(shallowNoNodes).toEqual([]) // ellipsoid.copc.laz data should be good
  expect(deepNoNodes).toEqual(shallowNoNodes) // checks should be equivalent

  const badCheck: pointChecker = (d) => {
    throw new Error('Fake bad check')
  }
  const shallowBadNodes = getBadNodes(shallowMap, badCheck)
  const deepBadNodes = getBadNodes(deepMap, badCheck)

  const allNodes = Object.keys(nodes)

  expect(shallowBadNodes).toEqual(allNodes)
  expect(deepBadNodes).toEqual(allNodes)
})

test('pd all-pass', async () => {
  const { filepath, get, copc, nodes } = await items
  const nodeMap = await readHierarchyNodes(nodes, filepath, false, maxThreads)
  const checks = await invokeAllChecks({
    source: { copc, nodeMap },
    suite: pointData,
  })
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})

test('pd pdrf=6', async () => {
  const { filepath, copc, nodes } = await items
  // create known-good Copc file with pdrf=6
  const pdrf6Copc: Copc = {
    ...copc,
    header: {
      ...copc.header,
      pointDataRecordFormat: 6,
    },
  }
  const nodeMap = await readHierarchyNodes(nodes, filepath, false)
  const nonRgbPd: shallowNodeMap = reduce(
    nodeMap,
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
    source: { copc: pdrf6Copc, nodeMap: nonRgbPd },
    suite: pointData,
  })
  // all-pass with known-good Copc file turned into pdrf=6 version
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))

  // create outdated Copc objects with pdrf=6
  const {
    filepath: oldFile,
    copc: oldCopc,
    nodes: oldNodes,
  } = await getCopcItems(ellipsoidFiles.oldCopc)
  const oldNodeMap = await readHierarchyNodes(
    oldNodes,
    oldFile,
    false,
    maxThreads,
  )
  const badOldCopc = {
    ...oldCopc,
    header: {
      ...oldCopc.header,
      pointDataRecordFormat: 6,
    },
  }
  const oldNonRgbChecks = await invokeAllChecks({
    source: { copc: badOldCopc, nodeMap: oldNodeMap },
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
  const { filepath, copc, nodes } = await items
  const pd = await readHierarchyNodes(nodes, filepath, false, maxThreads)
  // Creating point data with no dimensions to ensure complete failure of the suite
  const badNodeMap: shallowNodeMap = reduce(
    pd,
    (prev, curr, path) => ({ ...prev, [path]: { ...curr, root: {} } }),
    {},
  )
  const checks = await invokeAllChecks({
    source: { copc, nodeMap: badNodeMap },
    suite: pointData,
  })
  checks.forEach((check) => expect(check).not.toHaveProperty('status', 'pass'))

  const {
    filepath: oldFile,
    copc: oldCopc,
    nodes: oldNodes,
  } = await getCopcItems(ellipsoidFiles.oldCopc)
  // the original ellipsoid.copc.laz file had bad RGB and gpsTime data, so I'm
  // testing for those checks here
  const oldNodeMap = await readHierarchyNodes(
    oldNodes,
    oldFile,
    false,
    maxThreads,
  )
  const oldChecks = await invokeAllChecks({
    source: { copc: oldCopc, nodeMap: oldNodeMap },
    suite: pointData,
  })
  expect(findCheck(oldChecks, 'gpsTime')).toHaveProperty('status', 'fail')
  expect(findCheck(oldChecks, 'rgbi')).toHaveProperty('status', 'warn')
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
