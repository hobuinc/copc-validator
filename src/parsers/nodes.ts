import { Copc, Getter, Hierarchy } from 'copc'
import { resolve } from 'path'
import Piscina from 'piscina'
import { pointDataSuite } from 'suites'
import { Check, AllNodesChecked, CheckedNode } from 'types'
import { loadAllHierarchyPages } from 'utils'

/**
 *
 * @param nodes
 * @returns
 */
export const nonZeroNodes = (nodes: Hierarchy.Node.Map): string[] =>
  Object.entries(nodes).reduce<string[]>((acc, [key, data]) => {
    if (data!.pointCount !== 0) acc.push(key)
    return acc
  }, [])

type nodeParserParams = {
  get: Getter
  copc: Copc
  filepath: string
  deep?: boolean
  maxThreads?: number
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
}: nodeParserParams) => {
  const nodes = await loadAllHierarchyPages(get, copc)
  return {
    source: {
      data: await readPointDataRecords({
        nodes,
        filepath,
        copc,
        deep,
        maxThreads,
      }),
      nonZero: nonZeroNodes(nodes),
    },
    suite: pointDataSuite,
  }
}

export default nodeParser

// ========== UTILITIES ============
type readPointDataRecords = {
  nodes: Hierarchy.Node.Map
  filepath: string
  copc: Copc
  deep: boolean
  maxThreads?: number
}
export const readPointDataRecords = async ({
  nodes,
  filepath,
  copc,
  deep,
  maxThreads,
}: readPointDataRecords): Promise<AllNodesChecked> => {
  const piscina = new Piscina({
    filename: resolve(__dirname, 'worker.js'),
    // minThreads: (maxThreads && maxThreads / 2) || undefined,
    maxThreads,
    idleTimeout: 100,
    // concurrentTasksPerWorker: 24,
    // useAtomics: false, // threads dont communicate between themselves
  })

  // const checkedNodes: AllNodesChecked =
  return (
    await Promise.all(
      Object.entries(nodes).map(
        async ([key, node]) =>
          await piscina.run({ filepath, copc, key, node, deep }),
      ),
    )
  ).reduce<AllNodesChecked>((acc, [key, checkedNode]) => {
    acc[key] = checkedNode
    return acc
  }, {})
}
