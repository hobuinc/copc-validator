import { Copc, Getter, Hierarchy } from 'copc'
import { map } from 'lodash'

export type HierarchyCheckParams = { get: Getter; copc: Copc }
export type EnhanchedHierarchyParams = {
  copc: Copc
  pd: enhancedWithRootPoint<any>
}

export type NodePoint = {
  path: string
  rootPoint: Record<string, number>
}
export const getNodePoint = async (
  get: Getter,
  copc: Copc,
  nodes: Hierarchy.Node.Map,
): Promise<NodePoint[]> =>
  await Promise.all(
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

export type enhancedWithRootPoint<T extends object> = Record<
  string,
  T & { root: Record<string, number> }
>
// For Quick Scan of Hierarchy page
export type enhancedHierarchyNodes = enhancedWithRootPoint<Hierarchy.Node>
export const enhancedHierarchyNodes = (
  nodes: Hierarchy.Node.Map,
  points: NodePoint[],
): enhancedHierarchyNodes =>
  points.reduce(
    (prev, curr) => ({
      ...prev,
      [curr.path]: { ...nodes[curr.path], root: curr.rootPoint },
    }),
    {},
  )

export type NodePoints = {
  path: string
  points: Record<string, number>[]
}
export const getNodePoints = async (
  get: Getter,
  copc: Copc,
  nodes: Hierarchy.Node.Map,
): Promise<NodePoints[]> =>
  await Promise.all(
    map(nodes, async (node, path) => {
      const view = await Copc.loadPointDataView(get, copc, node!)

      const dimensions = Object.keys(view.dimensions)
      const getters = dimensions.map(view.getter)
      const getDimensions = (index: number): Record<string, number> =>
        getters.reduce(
          (prev, curr, i) => ({ ...prev, [dimensions[i]]: curr(index) }),
          {},
        )
      const points: Record<string, number>[] = (() =>
        Array.from(new Array(view.pointCount), (_v, index) =>
          getDimensions(index),
        ))()
      return { path, points }
    }),
  )

export type enhancedWithPointData<T extends object> = Record<
  string,
  T & { points: Record<number, Record<string, number>> }
>
// For Full Scan of Hierarchy page
export type fullHierarchyNodes = enhancedWithPointData<Hierarchy.Node>
export const fullHierarchyNodes = (
  nodes: Hierarchy.Node.Map,
  points: NodePoints[],
): fullHierarchyNodes =>
  points.reduce(
    (prev, curr) => ({
      ...prev,
      [curr.path]: {
        ...nodes[curr.path],
        points: curr.points.reduce(
          (prev, curr, i) => ({ ...prev, [i]: curr }),
          {},
        ),
      },
    }),
    {},
  )

// Intended to be one import for both full and quick scans, but the return type
// is messy so I'm currently not using it (getNodePoint vs getNodePoints is good enough)
export const getNodeData = (
  get: Getter,
  copc: Copc,
  nodes: Hierarchy.Node.Map,
  full: boolean = false,
) => (full ? getNodePoints(get, copc, nodes) : getNodePoint(get, copc, nodes))
export const isRootPoint = (
  pd: NodePoint[] | NodePoints[],
): pd is NodePoint[] => 'rootPoint' in pd[0]
export const isAllPoints = (
  pd: NodePoint[] | NodePoints[],
): pd is NodePoints[] => 'points' in pd[0]
export const NodeData = { isRootPoint, isAllPoints }
