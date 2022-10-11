import { invokeAllChecks } from '../../checks'
import { Copc, Getter } from 'copc'
import { Check } from 'types'
import {
  enhancedHierarchyNodes,
  fullHierarchyNodes,
  getNodePoint,
  getNodePoints,
} from './common'
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
      return [
        {
          id: 'pointData-NestedSuite',
          status: 'fail',
          info: (error as Error).message,
        },
      ]
    }
  },
  hierarchyNestedSuiteDeep: async ({ get, copc }) => {
    try {
      const { nodes } = await Copc.loadHierarchyPage(
        get,
        copc.info.rootHierarchyPage,
      )
      // TODO: Handle more than one page
      const points = await getNodePoints(get, copc, nodes)
      // fullHierarchyNodes() kills performance :(
      // const pd = fullHierarchyNodes(nodes, points)
      return [
        {
          id: 'pointData.deep-NestedSuite',
          status: 'pass',
          info: points.toString(),
          // info: pd.toString(),
        },
      ]
      // const pd = enhancedHierarchyNodes(nodes, points)
      // return invokeAllChecks({ source: { copc, pd }, suite: pointData })
    } catch (error) {
      return [
        {
          id: 'pointData-NestedSuite',
          status: 'fail',
          info: (error as Error).message,
        },
      ]
    }
  },
}

export default hierarchy
