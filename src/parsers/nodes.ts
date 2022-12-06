import { Copc, Hierarchy } from 'copc'
import { pointDataSuite } from '../suites/index.js'
import { Check, AllNodesChecked, nodeParserParams } from '../types/index.js'
import { loadAllHierarchyPages, runTasks } from '../utils/index.js'

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
): Promise<AllNodesChecked> =>
  runTasks(
    Object.entries(nodes).map(([key, node]) => ({
      filepath,
      key,
      node: node || { pointCount: 0, pointDataOffset: 0, pointDataLength: 0 },
      copc,
      deep,
    })),
    withBar,
    workerCount,
  )
