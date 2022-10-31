import { omit } from 'lodash'
import { readPointDataRecords } from 'parsers'
import { getCopcItems, maxThreads } from 'test'
import { AllNodesChecked, CheckedNode } from 'types'
import { checkAll, invokeAllChecks } from 'utils'
import pointDataSuite, { checkNodesReachable } from './point-data'

const items = getCopcItems()

test('pointDataSuite failures', async () => {
  const { nodes } = await items
  const nodeMap: AllNodesChecked = Object.fromEntries(
    Object.entries(nodes).map(([key, data]) => [
      key,
      {
        ...data,
        rgb: 'fail',
        rbgi: 'fail',
        xyz: 'fail',
        gpsTime: 'fail',
        sortedGpsTime: 'warn',
        returnNumber: 'fail',
      } as unknown as CheckedNode,
    ]),
  )
  // nodes are still reachable so kick that test out
  const suite = omit(pointDataSuite, 'nodesReachable')
  const checks = await invokeAllChecks({
    source: nodeMap,
    suite,
  })
  checkAll(checks, false)
})

test('nodesReachable failure', async () => {
  const { filepath, nodes } = await items
  const nodeMap = await readPointDataRecords({
    nodes,
    filepath,
    deep: false,
    maxThreads,
  })
  const badNodeMap = {
    ...nodeMap,
    '5-0-0-0': {
      pointCount: 0,
      pointDataOffset: 0,
      pointDataLength: 0,
    } as CheckedNode,
  } as AllNodesChecked
  expect(checkNodesReachable(badNodeMap)).toEqual({
    status: 'fail',
    info: 'Unreachable Nodes in Hierarchy: [ 5-0-0-0 ]',
  })
})
