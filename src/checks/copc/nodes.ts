import { invokeAllChecks } from 'checks'
import { Copc, Getter, Hierarchy } from 'copc'
import { map } from 'lodash'
import { Check } from 'types'
import { nodeScanParams } from './common'
import { deepNodeMap, pointData, shallowNodeMap } from './pointdata'

/**
 * Check.Suite to take care of scanning the Copc.info.rootHierarchyPage and reading
 * the nodes, either just the root points or all of the points, depending on the
 * `deep` parameter provided
 */
export const nodeScanSuite: Check.Suite<nodeScanParams> = {
  readNodes: async ({ get, copc, deep }) => {
    try {
      const { nodes } = await Copc.loadHierarchyPage(
        get,
        copc.info.rootHierarchyPage,
      )
      // TODO: Handle more than one page
      const nodeMap = await readHierarchyNodes(get, copc, nodes, deep)
      return invokeAllChecks({ source: { copc, nodeMap }, suite: pointData })
    } catch (error) {
      return [
        {
          id: `${deep ? 'deep.' : ''}pointData-NestedSuite`,
          status: 'fail',
          info: (error as Error).message,
        },
      ]
    }
  },
}

export default nodeScanSuite

export function readHierarchyNodes<B extends boolean>(
  get: Getter,
  copc: Copc,
  nodes: Hierarchy.Node.Map,
  deep: B,
): B extends true ? Promise<deepNodeMap> : Promise<shallowNodeMap>
export async function readHierarchyNodes(
  get: Getter,
  copc: Copc,
  nodes: Hierarchy.Node.Map,
  deep: boolean,
) {
  return stitchDataToNodes(nodes, await scanNodes(get, copc, nodes, deep))
}

export function stitchDataToNodes<D extends nodeScan>(
  nodes: Hierarchy.Node.Map,
  data: D,
): D extends deepNodeScan[] ? deepNodeMap : shallowNodeMap
export function stitchDataToNodes(nodes: Hierarchy.Node.Map, data: nodeScan) {
  return nodeScan.isDeepNodeScan(data)
    ? data.reduce<deepNodeMap>(
        (prev, { key, points }) => ({
          ...prev,
          [key]: { ...(nodes[key] as Hierarchy.Node), points },
        }),
        {},
      )
    : data.reduce<shallowNodeMap>(
        (prev, { key, root }) => ({
          ...prev,
          [key]: { ...(nodes[key] as Hierarchy.Node), root },
        }),
        {},
      )
}

export function scanNodes<B extends boolean>(
  get: Getter,
  copc: Copc,
  nodes: Hierarchy.Node.Map,
  deep: B,
): B extends true ? Promise<deepNodeScan[]> : Promise<shallowNodeScan[]>
export function scanNodes(
  get: Getter,
  copc: Copc,
  nodes: Hierarchy.Node.Map,
  deep: boolean,
) {
  return Promise.all(
    map(nodes, async (node, key) => {
      const view = await Copc.loadPointDataView(get, copc, node!)
      const dimensions = Object.keys(view.dimensions)
      const getters = dimensions.map(view.getter)
      const getDimensions = (idx: number): Record<string, number> =>
        getters.reduce(
          (prev, curr, i) => ({ ...prev, [dimensions[i]]: curr(idx) }),
          {},
        )
      return deep
        ? ({
            key,
            points: Array.from(new Array(view.pointCount), (_v, i) =>
              getDimensions(i),
            ),
          } as deepNodeScan)
        : ({ key, root: getDimensions(0) } as shallowNodeScan)
    }),
  )
}

// ========== TYPES ==========
export type shallowNodeScan = {
  key: string
  root: Record<string, number>
}
export type deepNodeScan = {
  key: string
  points: Record<string, number>[]
}
export type nodeScan = shallowNodeScan[] | deepNodeScan[]

const isDeepNodeScan = (d: nodeScan): d is deepNodeScan[] =>
  Object.keys(d[0]).includes('points')
const isShallowNodeScan = (d: nodeScan): d is shallowNodeScan[] =>
  Object.keys(d[0]).includes('root')
export const nodeScan = { isDeepNodeScan, isShallowNodeScan }
