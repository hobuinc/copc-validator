import { basicCheck } from 'checks'
import { Copc, Getter, Hierarchy } from 'copc'
import { isEqual, map, reduce } from 'lodash'
import { Check } from 'types'
import {
  HierarchyCheckParams,
  enhancedHierarchyNodes,
  NodePoint,
} from './common'

export const hierarchy: Check.Suite<HierarchyCheckParams> = {
  enhancedHierarchy: async ({ get, copc }) => {
    const {
      info: { rootHierarchyPage },
      header: { pointDataRecordFormat },
    } = copc
    try {
      const hierarchy = await Copc.loadHierarchyPage(get, rootHierarchyPage)
      const { nodes, pages } = hierarchy
      const pd: NodePoint[] = await Promise.all(
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
      const enhancedHierarchy = enhancedHierarchyNodes(nodes, pd)

      if (![6, 7, 8].includes(pointDataRecordFormat))
        throw new Error(
          `Invalid Point Data Record Format (PDRF: 6 | 7 | 8): ${pointDataRecordFormat}`,
        )

      // const rgbCheck = checkRgb(
      //   enhancedHierarchy,
      //   pointDataRecordFormat as 6 | 7 | 8,
      // )
      return {
        status: 'pass',
        info: { enhancedHierarchy },
      }
    } catch (e) {
      return { status: 'fail', info: e as Error }
    }
  },
}

export default hierarchy
