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
  // setup piscina
  const piscina = new Piscina({
    filename: resolve(__dirname, 'worker.js'),
    maxThreads,
    idleTimeout: 100,
  })

  const nodeCount = Object.keys(nodes).length
  const { start, opts } = {
    start: deep ? copc.header.pointCount : nodeCount,
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
      deep ? 'nodes' : 'points'
    } [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`,
    barCompleteChar: '=',
    barIncompleteChar: '-',
    clearOnComplete: true,
    ...opts,
  })
  bar.start(start, 0)

  const checkedNodes: AllNodesChecked = (
    await Promise.all(
      Object.entries(nodes).map(async ([key, node]) => {
        const r: [string, CheckedNode] = await piscina.run({
          filepath,
          copc,
          key,
          node,
          deep,
        })
        bar.increment(deep ? node?.pointCount : 1)
        return r
      }),
    )
  ).reduce<AllNodesChecked>((acc, [key, checkedNode]) => {
    acc[key] = checkedNode
    return acc
  }, {})
  bar.stop()
  return checkedNodes
}
export const readPointDataRecordsWOBar = async ({
  nodes,
  filepath,
  copc,
  deep,
  maxThreads,
}: readPDRsParams): Promise<AllNodesChecked> => {
  // setup piscina
  const piscina = new Piscina({
    filename: resolve(__dirname, 'worker.js'),
    maxThreads,
    idleTimeout: 100,
  })

  return (
    // read each node
    (
      await Promise.all(
        Object.entries(nodes).map(
          async ([key, node]) =>
            await piscina.run({
              filepath,
              copc,
              key,
              node,
              deep,
            }),
        ),
      )
    )
      // and turn it back into a Hierarchy.Node.Map-like object
      .reduce<AllNodesChecked>((acc, [key, checkedNode]) => {
        acc[key] = checkedNode
        return acc
      }, {})
  )
}
