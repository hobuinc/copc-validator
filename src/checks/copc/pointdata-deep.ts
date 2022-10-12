import { invokeAllChecks, Statuses } from '../../checks'
import { Copc, Getter, Point } from 'copc'
import { Check } from 'types'
import {
  copcWithGetter,
  enhancedHierarchyNodes,
  enhancedWithRootPoint,
  getNodePoints,
} from './common'
import { isEqual, reduce } from 'lodash'

export const deepNodeScan: Check.Suite<copcWithGetter> = {
  readAllPoints: async ({ get, copc }) => {
    try {
      const { nodes } = await Copc.loadHierarchyPage(
        get,
        copc.info.rootHierarchyPage,
      )
      // TODO: Handle more than one page
      // this works fine, in like 1.5 seconds for ellipsoid.copc.laz
      const points = await getNodePoints(get, copc, nodes)
      // const pd = fullHierarchyNodes(nodes, points)
      // fullHierarchyNodes() kills performance :( do not use
      // can probably just use the getNodePoints() data? will look into it

      return [
        {
          id: 'deep-nodeScan.NS',
          status: 'pass',
        },
      ]
      // return invokeAllChecks({})
    } catch (error) {
      return [
        {
          id: 'deep-nodeScan.NS',
          status: 'fail',
          info: (error as Error).message,
        },
      ]
    }
  },
}

export default deepNodeScan

// ========== POINT DATA CHECKS ==========
