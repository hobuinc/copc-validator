import { Copc, Getter, Hierarchy } from 'copc'
import { resolve } from 'path'
import Piscina from 'piscina'
import { pointDataSuite } from 'suites'
import { Check, AllNodesChecked, CheckedNode } from 'types'
import { loadAllHierarchyPages } from 'utils'
import { SingleBar } from 'cli-progress'

export type nodeParserParams = {
  get: Getter
  copc: Copc
  filepath: string
  deep?: boolean
  maxThreads?: number
  showProgress?: boolean
}
export const nodeParser: Check.Parser<
  nodeParserParams,
  { data: AllNodesChecked; nonZero: string[] }
> = async ({
  get,
  copc,
  filepath,
  deep = false,
  maxThreads,
  showProgress = false,
}: nodeParserParams) => {
  const nodes = await loadAllHierarchyPages(get, copc)
  return {
    source: {
      data: await readPointDataRecords(
        {
          nodes,
          filepath,
          copc,
          deep,
          maxThreads,
        },
        showProgress,
      ),
      nonZero: nonZeroNodes(nodes),
    },
    suite: pointDataSuite,
  }
}

export default nodeParser

// ========== UTILITIES ============
/**
 *
 * @param nodes
 * @returns Array containing `D-X-Y-Z` key of each node that contains points
 */
export const nonZeroNodes = (nodes: Hierarchy.Node.Map): string[] =>
  Object.entries(nodes).reduce<string[]>((acc, [key, data]) => {
    if (data && data.pointCount !== 0) acc.push(key)
    return acc
  }, [])

export type readPDRsParams = {
  nodes: Hierarchy.Node.Map
  filepath: string
  copc: Copc
  deep: boolean
  maxThreads?: number
}
/**
 *
 * @param params readPDRsParams object
 * @param withBar Turns `cli-progress` bar On (true) or Off (false)
 * @returns
 */
export const readPointDataRecords = (
  params: readPDRsParams,
  withBar = false,
): Promise<AllNodesChecked> =>
  withBar ? readPointDataRecordsWBar(params) : readPointDataRecordsWOBar(params)

// ===== readPointDataRecord functions =====
export const readPointDataRecordsWBar = async ({
  nodes,
  filepath,
  copc,
  deep,
  maxThreads,
}: readPDRsParams): Promise<AllNodesChecked> => {
  const piscina = new Piscina({
    filename: resolve(__dirname, 'worker.js'),
    maxThreads,
    idleTimeout: 100,
    useAtomics: false,
  })

  const nodeCount = Object.keys(nodes).length
  const { total, opts } = {
    total: deep ? copc.header.pointCount : nodeCount,
    opts: {
      barsize:
        process.stderr.columns > 80
          ? Math.floor(process.stderr.columns / 2)
          : 40,
      etaBuffer: nodeCount > 30 ? Math.floor(nodeCount / 3) : 10,
    },
  }
  const bar = new SingleBar({
    format: `checking ${
      deep ? 'all' : 'root'
    } points [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`,
    barCompleteChar: '=',
    barIncompleteChar: '-',
    clearOnComplete: true,
    ...opts,
  })
  bar.start(total, 0)

  const promises: [string, Promise<CheckedNode>][] = Object.entries(nodes).map(
    ([key, node]) => [
      key,
      piscina.run({
        filepath,
        copc,
        key,
        node,
        deep,
      }),
    ],
  )
  let checkedNodes: AllNodesChecked = {}
  for (const [key, pNode] of promises) {
    const n = await pNode
    bar.increment(deep ? n.pointCount : 1)
    checkedNodes[key] = n
  }

  bar.stop()
  return checkedNodes
}
// separate function so we don't bother initializing the bar if it's unnecessary
export const readPointDataRecordsWOBar = async ({
  nodes,
  filepath,
  copc,
  deep,
  maxThreads,
}: readPDRsParams): Promise<AllNodesChecked> => {
  const piscina = new Piscina({
    filename: resolve(__dirname, 'worker.js'),
    maxThreads,
    idleTimeout: 100,
    useAtomics: false,
  })

  let checkedNodes: AllNodesChecked = {}
  for (const [key, cNode] of Object.entries(nodes).map(([key, node]) => [
    key,
    piscina.run({
      filepath,
      copc,
      key,
      node,
      deep,
    }),
  ]) as [string, Promise<CheckedNode>][]) {
    checkedNodes[key] = await cNode
  }
  return checkedNodes
}
