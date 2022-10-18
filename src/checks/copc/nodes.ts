import { invokeAllChecks } from 'checks'
import { Copc, Getter, Hierarchy, View } from 'copc'
import { map } from 'lodash'
import { Check, Pool } from 'types'
import { nodeScanParams } from './common'
import {
  deepNodeMap,
  enhancedNodeMap,
  pointData,
  shallowNodeMap,
} from './pointdata'
import Piscina from 'piscina'
import { resolve } from 'path'

/**
 * Check.Suite to take care of scanning the Copc.info.rootHierarchyPage and reading
 * the nodes, either just the root points or all of the points, depending on the
 * `deep` parameter provided
 */
export const nodeScanSuite: Check.Suite<nodeScanParams> = {
  pointDataNS: async ({ get, copc, deep, filename, maxThreads }) => {
    try {
      const { nodes } = await Copc.loadHierarchyPage(
        get,
        copc.info.rootHierarchyPage,
      )
      // TODO: Handle more than one page
      const nodeMap = await readHierarchyNodes(
        get,
        copc,
        nodes,
        filename,
        deep,
        maxThreads,
      )
      return invokeAllChecks({ source: { copc, nodeMap }, suite: pointData })
    } catch (e) {
      return [
        {
          id: `${deep ? 'deep.' : ''}pointData-NestedSuite`,
          status: 'fail',
          info: (e as Error).message,
        },
      ]
    }
  },
}

// type poolParams = { get: Getter; copc: Copc; deep: boolean }
// export const nodeScanPool: Pool.Suite.Nested = async ({
//   get,
//   copc,
//   deep = false,
// }: poolParams) => {
//   const { nodes } = await Copc.loadHierarchyPage(
//     get,
//     copc.info.rootHierarchyPage,
//   )
//   const nodeMap = await readHierarchyNodes(get, copc, nodes, deep)
//   return [
//     { source: { copc, nodeMap }, suite: pointData },
//   ] as Pool.Suite.withSource<any>[]
// }

export default nodeScanSuite

/**
 * Utility that neatly wraps `stitchDataToNodes()` with its required output from
 * `scanNodes()` and returns either a shallow or deep Node Map (`./pointdata.ts`),
 * depending on the `deep` parameter provided (with a smart return type)
 * @param get Getter for Copc file
 * @param copc Copc object from Copc.create()
 * @param nodes `nodes` object from Copc.loadHierarchyPage()
 * @param deep Boolean parameter to pass through to scanNodes()
 * @returns
 * ```
 * if (deep === true ): Promise<deepNodeMap>
 * if (deep === false): Promise<shallowNodeMap>
 * ```
 */
export function readHierarchyNodes<B extends boolean>(
  get: Getter,
  copc: Copc,
  nodes: Hierarchy.Node.Map,
  filename: string,
  deep: B,
  maxThreads?: number,
): B extends true ? Promise<deepNodeMap> : Promise<shallowNodeMap>
export async function readHierarchyNodes(
  get: Getter,
  copc: Copc,
  nodes: Hierarchy.Node.Map,
  filename: string,
  deep: boolean,
  maxThreads?: number,
) {
  const piscina = new Piscina({
    filename: resolve(__dirname, 'worker.js'),
    maxThreads,
    idleTimeout: 100,
  })
  //return stitchDataToNodes(nodes, await scanNodes(get, copc, nodes, deep))
  return stitchDataToNodes(
    nodes,
    await scanNodesPooled(
      get,
      copc,
      nodes,
      filename, //|| resolve(__dirname, '../../../autzen-classified.copc.laz'), //resolve(__dirname, '../../test/data/ellipsoid.copc.laz'),
      piscina,
      deep,
    ),
  )
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

/**
 *
 * @param get Getter for Copc file
 * @param copc Copc object from Copc.create()
 * @param nodes `nodes` object from Copc.loadHierarchyPage()
 * @param deep Boolean parameter to pass through to scanNodes()
 * @returns
 * ```
 * if (deep === true ): Promise<deepNodeScan[]>
 * if (deep === false): Promise<shallowNodeScan[]>
 * ```
 */
export function scanNodes<B extends boolean>(
  get: Getter,
  copc: Copc,
  nodes: Hierarchy.Node.Map,
  // piscina: Piscina,
  deep: B,
): B extends true ? Promise<deepNodeScan[]> : Promise<shallowNodeScan[]>
export function scanNodes(
  get: Getter,
  copc: Copc,
  nodes: Hierarchy.Node.Map,
  // piscina: Piscina,
  deep: boolean,
) {
  return Promise.all(
    map(nodes, async (node, key) => {
      console.time(key)
      const view = await Copc.loadPointDataView(get, copc, node!)
      // console.log(`${key}: ${view.pointCount}`)
      const dimensions = Object.keys(view.dimensions)
      const getters = dimensions.map(view.getter)
      const getDimensions = (idx: number): Record<string, number> =>
        getters.reduce(
          (prev, curr, i) => ({ ...prev, [dimensions[i]]: curr(idx) }),
          {},
        )
      const scan = deep
        ? ({
            key,
            points: Array.from(new Array(view.pointCount), (_v, i) =>
              getDimensions(i),
            ),
          } as deepNodeScan)
        : ({ key, root: getDimensions(0) } as shallowNodeScan)
      console.timeEnd(key)
      return scan
    }),
  )
}

export async function scanNodesPooled<B extends boolean>(
  get: Getter,
  copc: Copc,
  nodes: Hierarchy.Node.Map,
  filename: string,
  piscina: Piscina,
  deep: B,
): Promise<B extends true ? deepNodeScan[] : shallowNodeScan[]>
export async function scanNodesPooled(
  get: Getter,
  copc: Copc,
  nodes: Hierarchy.Node.Map,
  filename: string,
  piscina: Piscina,
  deep: boolean,
) {
  return Promise.all(
    map(nodes, async (node, key) => {
      console.time(key)
      const view = await Copc.loadPointDataView(get, copc, node!)
      const dimensions = Object.keys(view.dimensions)
      const getters = dimensions.map(view.getter)
      const getDimensions = (idx: number): Record<string, number> =>
        getters.reduce(
          (prev, curr, i) => ({ ...prev, [dimensions[i]]: curr(idx) }),
          {},
        )
      const data = await piscina.run({ filename, /*copc,*/ node, deep })
      console.timeEnd(key)
      return deep ? { key, points: data } : { key, root: data }
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
