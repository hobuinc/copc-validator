import { Copc, Getter, Hierarchy } from 'copc'
import { Check } from 'types'

export const Messages = {
  moreInfoOnFullScan: 'Run a Full Scan for more information',
  success: { status: 'pass' } as Check.Status,
  failure: { status: 'fail' } as Check.Status,
  successWithInfo: (info: any) => ({ status: 'pass', info } as Check.Status),
  failureWithInfo: (info: any) => ({ status: 'fail', info } as Check.Status),
  warningWithInfo: (info: any) => ({ status: 'warn', info } as Check.Status),
}

export type HierarchyCheckParams = { get: Getter; copc: Copc }
export type EnhanchedHierarchyParams = {
  copc: Copc
  pd: enhancedWithPointData<any>
}

export type NodePoint = {
  path: string
  rootPoint: Record<string, number>
}
export type enhancedWithPointData<T extends object> = Record<
  string,
  T & { root: Record<string, number> }
>
export type enhancedHierarchyNodes = enhancedWithPointData<Hierarchy.Node>
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
