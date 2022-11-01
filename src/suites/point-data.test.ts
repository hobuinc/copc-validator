import { difference } from 'lodash'
import { readPointDataRecords } from 'parsers'
import { ellipsoidFiles, getCopcItems, maxThreads } from 'test'
import { AllNodesChecked, CheckedNode } from 'types'
import { checkAll, findCheck, invokeAllChecks } from 'utils'
import pointDataSuite, { nodeString, nonZeroNodes as NZN } from './point-data'

const items = getCopcItems()

test('pointDataSuite all-pass', async () => {
  const { filepath, nodes } = await items
  const checks = await invokeAllChecks({
    source: await readPointDataRecords({
      filepath,
      nodes,
      deep: true,
      maxThreads,
    }),
    suite: pointDataSuite,
  })
  checkAll(checks)
})

test('pointDataSuite failures', async () => {
  const { nodes } = await items
  const nodeMap: AllNodesChecked = Object.fromEntries(
    Object.entries(nodes)
      .map(([key, data]) => [
        key,
        {
          ...data,
          rgb: 'fail',
          rgbi: 'fail',
          xyz: 'fail',
          gpsTime: 'fail',
          sortedGpsTime: 'warn',
          returnNumber: 'fail',
        } as unknown as CheckedNode,
      ])
      .concat([
        [
          '5-0-0-0',
          {
            pointCount: 0,
            pointDataOffset: 0,
            pointDataLength: 0,
            rgb: 'pass',
            rgbi: 'pass',
            xyz: 'pass',
            gpsTime: 'pass',
            sortedGpsTime: 'pass',
            returnNumber: 'pass',
            zeroPoint: 'warn',
          } as unknown as CheckedNode,
        ],
      ]),
  )
  const checks = await invokeAllChecks({
    source: nodeMap,
    suite: pointDataSuite,
  })
  checkAll(checks, false)
})

test('pointDataSuite pdrf=6', async () => {
  // get copc data with unscaled RGBI data
  const { filepath, nodes } = await getCopcItems(ellipsoidFiles.oldCopc)
  const nodeMap = await readPointDataRecords({
    filepath,
    nodes,
    deep: false,
    maxThreads,
  })

  // pretend 'rgb' test returned 'warn' (meaning pdrf = 7 | 8)
  const rgbWarnMap = Object.fromEntries(
    Object.entries(nodeMap).map(([key, data]) => [
      key,
      { ...data, rgb: 'warn' },
    ]),
  ) as unknown as AllNodesChecked
  const rgbWarnChecks = await invokeAllChecks({
    source: rgbWarnMap,
    suite: pointDataSuite,
  })

  // rgb assertions
  const rgbWarn = findCheck(rgbWarnChecks, 'rgb')
  expect(rgbWarn).toHaveProperty('status', 'warn')
  expect(rgbWarn).toHaveProperty(
    'info',
    expect.stringContaining('(PDRF 7,8) Unutilized RGB bytes found in:'),
  )
  // rgbi assertion
  const rgbiWarn = findCheck(rgbWarnChecks, 'rgbi')
  expect(rgbiWarn).toHaveProperty(
    'info',
    'All Nodes contain 8-bit RGBI data. Should be scaled to 16-bit.', //expect.stringContaining('Intensity'),
  )

  // pretend 'rgb' test returned 'fail' (meaning pdrf = 6)
  const rgbFailMap = Object.fromEntries(
    Object.entries(nodeMap).map(([key, data]) => [
      key,
      { ...data, rgb: 'fail' },
    ]),
  ) as unknown as AllNodesChecked
  const rgbFailChecks = await invokeAllChecks({
    source: rgbFailMap,
    suite: pointDataSuite,
  })

  // rgb assertions
  const rgbFail = findCheck(rgbFailChecks, 'rgb')
  expect(rgbFail).toHaveProperty('status', 'fail')
  expect(rgbFail).toHaveProperty(
    'info',
    expect.stringContaining('(PDRF 6) RGB data found in:'),
  )
  // rgbi assertion
  const rgbiFail = findCheck(rgbFailChecks, 'rgbi')
  expect(rgbiFail).toEqual(rgbiWarn)
})

test('pointDataSuite utils', async () => {
  const { filepath, nodes } = await items
  const realNodeChecks = await readPointDataRecords({
    filepath,
    nodes,
    deep: false,
    maxThreads,
  })
  const nodeChecks = Object.fromEntries(
    Object.entries(realNodeChecks)
      .map(([key, data]) => [
        key,
        {
          ...data,
        },
      ])
      .concat([
        [
          '1-1-1-1',
          {
            pointCount: 0,
            pointDataOffset: 0,
            pointDataLength: 0,
            rgb: 'pass',
            rgbi: 'pass',
            xyz: 'pass',
            gpsTime: 'pass',
            sortedGpsTime: 'pass',
            returnNumber: 'pass',
            zeroPoint: 'warn',
          } as unknown as CheckedNode,
        ],
      ]),
  ) as unknown as AllNodesChecked
  const allNodes = Object.keys(nodeChecks) //length: 6
  const nonZeroNodes = NZN(nodeChecks) //length: 5
  expect(
    nodeString(
      allNodes,
      nonZeroNodes, // more bad nodes than non-zero nodes
    ), // also 2+ more non-zero nodes than bad nodes
  ).toBe(`[ ${allNodes} ]`)
  expect(nodeString(allNodes, allNodes)).toBe('[ ALL-NODES ]') //same length bad nodes and non-zero nodes
  expect(nodeString(nonZeroNodes, allNodes)).toBe(
    `[ ALL-BUT-ONE-NODE: ${difference(allNodes, nonZeroNodes)} ]`,
  ) // 1 more non-zero node than bad node
})
