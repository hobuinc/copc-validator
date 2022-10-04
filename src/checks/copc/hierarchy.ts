import { invokeAllChecks } from '../../checks'
import { Copc } from 'copc'
import { Check } from 'types'
import {
  HierarchyCheckParams,
  enhancedHierarchyNodes,
  getNodePoint,
} from './common'
import pointData from './point-data'

/**
 * hierarchyNestedSuite: Runs point-data.ts suite
 */
export const hierarchy: Check.Suite<HierarchyCheckParams> = {
  hierarchyNestedSuite: async ({ get, copc }) => {
    try {
      const { nodes } = await Copc.loadHierarchyPage(
        get,
        copc.info.rootHierarchyPage,
      )
      // TODO: Handle more than one page
      const points = await getNodePoint(get, copc, nodes)
      const pd = enhancedHierarchyNodes(nodes, points)
      return invokeAllChecks({ source: { copc, pd }, suite: pointData })
    } catch (error) {
      return [{ id: 'hierarchyNestedSuite', status: 'fail', info: error }]
    }
  },
}
// currently no `hierarchy.test.ts` since it only calls `point-data.ts`, which
// is covered by `point-data.test.ts` tests

export default hierarchy
