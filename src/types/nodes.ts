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

/**
 * @example ```
 * {
 *   pointCount: 123
 *   pointDataOffset: 34234
 *   pointDataLength: 2312
 *   rgb: 'pass'
 *   rgbi: 'warn'
 *   xyz: 'fail'
 *   gpsTime: 'pass'
 *   sortedGpsTime: 'warn'
 *   returnNumber: 'pass'
 * }
 * ```
 */
export type CheckedNode = Hierarchy.Node & {
  [id: string]: 'pass' | 'fail' | 'warn'
}
/**
 * Extended Hierarchy.Node.Map from `'copc'`
 */
export type AllNodesChecked = { [key: string]: CheckedNode }

// =========== TYPES ===========
// My version(s) of Hierarchy.Node.Map with point data tacked on
type NodeMap<P extends object> = Record<string, Hierarchy.Node & P>
export type shallowNodeMap = NodeMap<{ root: Record<string, number> }>
export type deepNodeMap = NodeMap<{ points: Record<string, number>[] }>
export type enhancedNodeMap = shallowNodeMap | deepNodeMap

export type pointChecker = (d: Record<string, number>) => boolean
