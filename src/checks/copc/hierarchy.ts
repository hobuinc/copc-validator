import { invokeAllChecks } from '../../checks'
import { Copc, Getter } from 'copc'
import { Check } from 'types'
import { enhancedHierarchyNodes, getNodePoint } from './common'
import pointData from './point-data'

/**
 * hierarchyNestedSuite: Runs point-data.ts suite
 */
export const hierarchy: Check.Suite<{ get: Getter; copc: Copc }> = {
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
      return [{ id: 'pointData-NestedSuite', status: 'fail', info: error }]
    }
  },
}

export default hierarchy
