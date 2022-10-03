import { Copc, Getter, Hierarchy } from 'copc'

export type HierarchyCheckParams = { get: Getter; copc: Copc }
export type EnhanchedHierarchyParams = {
  copc: Copc
  pd: enhancedWithRootPoint<any>
}

export type NodePoint = {
  path: string
  rootPoint: Record<string, number>
}
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
