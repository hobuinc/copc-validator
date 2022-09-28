import { Copc, Getter, Hierarchy } from 'copc'
import { map } from 'lodash'
import { Check } from 'types'
import { HierarchyCheckParams } from './common'

export const hierarchy: Check.Suite<HierarchyCheckParams> = {
  'rootHierarchyPage rootPoints': async ({ get, copc }) => {
    try {
      const hierarchy = await Copc.loadHierarchyPage(
        get,
        copc.info.rootHierarchyPage,
      )
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
      return {
        status: 'pass',
        info: enhancedHierarchyNodes(nodes, pd),
      }
    } catch (e) {
      return { status: 'fail', info: e as Error }
    }
  },
}

type NodePoint = {
  path: string
  rootPoint: Record<string, number>
}
const enhancedHierarchyNodes = (
  nodes: Hierarchy.Node.Map,
  points: NodePoint[],
): Record<string, Hierarchy.Node & { root: Record<string, number> }> =>
  points.reduce(
    (prev, curr) => ({
      ...prev,
      [curr.path]: { ...nodes[curr.path], root: curr.rootPoint },
    }),
    {},
  )

export default hierarchy
