import { invokeAllChecks } from '../../checks'
import { Copc, Getter, Hierarchy } from 'copc'
import { isEqual, map, reduce } from 'lodash'
import { Check } from 'types'
import {
  HierarchyCheckParams,
  enhancedHierarchyNodes,
  NodePoint,
} from './common'
import pointData from './point-data'

export const hierarchy: Check.Suite<HierarchyCheckParams> = {
  hierarchyNestedSuite: async ({ get, copc }) => {
    try {
      const { nodes } = await Copc.loadHierarchyPage(
        get,
        copc.info.rootHierarchyPage,
      )
      const points: NodePoint[] = await Promise.all(
        map(nodes, async (node, path) => {
          const view = await Copc.loadPointDataView(get, copc, node!)

          const dimensions = Object.keys(view.dimensions)
          const getters = dimensions.map(view.getter)
          const getDimensions = (index: number): Record<string, number> =>
            getters.reduce(
              (prev, curr, i) => ({ ...prev, [dimensions[i]]: curr(index) }),
              {},
            )

          const rootPoint = getDimensions(0)
          return { path, rootPoint }
        }),
      )
      const pd = enhancedHierarchyNodes(nodes, points)
      return invokeAllChecks([{ source: { copc, pd }, suite: pointData }])
    } catch (error) {
      return [{ id: 'hierarchyNestedSuite', status: 'fail', info: error }]
    }
  },
}

export default hierarchy
