import { Copc, Getter, Hierarchy } from 'copc'
import { resolve } from 'path'
import Piscina from 'piscina'
import { pointDataSuite } from 'suites'
import {
  Check,
  deepNodeMap,
  deepNodeScan,
  nodeScan,
  pointDataParams,
  shallowNodeMap,
  shallowNodeScan,
} from 'types'

type nodeParserParams = {
  get: Getter
  copc: Copc
  filepath: string
  deep?: boolean
  maxThreads?: number
}
export const nodeParser: Check.Parser<
  nodeParserParams,
  pointDataParams
> = async ({ get, copc, filepath, deep = false, maxThreads }) => {
  const { nodes } = await Copc.loadHierarchyPage(
    get,
    copc.info.rootHierarchyPage,
  )
  const nodeMap = await readHierarchyNodes(nodes, filepath, deep, maxThreads)
  return { source: { copc, nodeMap }, suite: pointDataSuite }
}

export default nodeParser

// ========== UTILITIES ============

/**
 * Utility that neatly wraps `stitchDataToNodes()` with its required output from
 * `scanNodes()` and returns either a shallow or deep Node Map (`./pointdata.ts`),
 * depending on the `deep` parameter provided (with a smart return type)
 * @param nodes `nodes` object from `Copc.loadHierarchyPage()`
 * @param filepath original filepath passed to `Getter.create()`, cloned for worker threads
 * @param deep Boolean parameter to pass through to scanNodes()
 * @param maxThreads Optional maxThread count to pass to `Piscina` - based on
 * CPU if omitted
 * @returns
 * ```
 * if (deep === true ): Promise<deepNodeMap>
 * if (deep === false): Promise<shallowNodeMap>
 * ```
 */
export function readHierarchyNodes<B extends boolean>(
  nodes: Hierarchy.Node.Map,
  filepath: string,
  deep: B,
  maxThreads?: number,
): B extends true ? Promise<deepNodeMap> : Promise<shallowNodeMap>
export async function readHierarchyNodes(
  nodes: Hierarchy.Node.Map,
  filepath: string,
  deep: boolean,
  maxThreads?: number,
) {
  const piscina = new Piscina({
    filename: resolve(__dirname, 'worker.js'),
    maxThreads,
    idleTimeout: 100,
  })
  return stitchDataToNodes(
    nodes,
    await scanNodes(nodes, filepath, piscina, deep),
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

export async function scanNodes<B extends boolean>(
  nodes: Hierarchy.Node.Map,
  filepath: string,
  piscina: Piscina,
  deep: B,
): Promise<B extends true ? deepNodeScan[] : shallowNodeScan[]>
export async function scanNodes(
  nodes: Hierarchy.Node.Map,
  filepath: string,
  piscina: Piscina,
  deep: boolean,
) {
  return Promise.all(
    Object.entries(nodes).map(async ([key, node]) =>
      deep
        ? { key, points: await piscina.run({ filepath, node, deep }) }
        : { key, root: await piscina.run({ filepath, node, deep }) },
    ),
  )
}
