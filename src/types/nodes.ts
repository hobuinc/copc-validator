import { Hierarchy } from 'copc'

export type shallowNodeScan = {
  key: string
  root: Record<string, number>
}
export type deepNodeScan = {
  key: string
  points: Record<string, number>[]
}
export type nodeScan = shallowNodeScan[] | deepNodeScan[]
type nodeScanData = Record<string, number> | Record<string, number>[]

const isDeepNodeScan = (d: nodeScan): d is deepNodeScan[] =>
  Object.keys(d[0]).includes('points')
// const isShallowNodeScan = (d: nodeScan): d is shallowNodeScan[] =>
//   Object.keys(d[0]).includes('root')
export const nodeScan = { isDeepNodeScan /*isShallowNodeScan*/ }

// =========== TYPES ===========
// My version(s) of Hierarchy.Node.Map with point data tacked on
type NodeMap<P> = Record<string, Hierarchy.Node & P>
export type shallowNodeMap = NodeMap<{ root: Record<string, number> }>
export type deepNodeMap = NodeMap<{ points: Record<string, number>[] }>
export type enhancedNodeMap = shallowNodeMap | deepNodeMap
// const isDeepMap = (d: enhancedNodeMap): d is deepNodeMap =>
//   'points' in Object.values(d)[0]
// const isShallowMap = (d: enhancedNodeMap): d is shallowNodeMap =>
//   'root' in Object.values(d)[0]
// export const enhancedNodeMap = {
//   isDeepMap,
//   isShallowMap,
// }

export type pointChecker = (d: Record<string, number>) => boolean
// export type multiPointChecker = (d: Record<string, number>[]) => boolean
