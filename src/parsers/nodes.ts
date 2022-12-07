import { Copc, Hierarchy } from 'copc'
import { pointDataSuite } from '../suites/index.js'
import { Check, AllNodesChecked, nodeParserParams } from '../types/index.js'
import { loadAllHierarchyPages, Paths, runTasks } from '../utils/index.js'

export const nodeParser: Check.Parser<
  nodeParserParams,
  { data: AllNodesChecked; nonZero: string[] }
> = async ({
  get,
  copc,
  filepath,
  deep = false,
  workerCount,
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
          workerCount,
        },
        showProgress,
      ),
      nonZero: nonZeroNodes(nodes),
    },
    suite: pointDataSuite,
  }
}

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
  workerCount?: number
}
/**
 *
 * @param params readPDRsParams object
 * @param withBar Turns `cli-progress` bar On (true) or Off (false)
 * @returns
 */
export const readPointDataRecords = (
  { nodes, filepath, copc, deep, workerCount }: readPDRsParams,
  withBar = false,
): Promise<AllNodesChecked> => {
  // console.log('READ PDR', Paths.lazPerf)
  return runTasks(
    // turn Hierarchy.Node.Map into Array of Worker tasks
    Object.entries(nodes).map(([key, node]) => ({
      filepath,
      key,
      node: node || { pointCount: 0, pointDataOffset: 0, pointDataLength: 0 },
      copc,
      deep,
      lazPerfWasmFilename: Paths.lazPerf,
      // typeof process === 'object'
      //   ? 'laz-perf.wasm'
      //   : window.origin + '/laz-perf.wasm',
    })),
    withBar,
    workerCount,
  )
}
