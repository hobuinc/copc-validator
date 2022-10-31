import { Copc, Getter, Hierarchy } from 'copc'
import { resolve } from 'path'
import Piscina from 'piscina'
import { pointDataSuite } from 'suites'
import { Check, AllNodesChecked } from 'types'
import { loadAllHierarchyPages } from 'utils'

type nodeParserParams = {
  get: Getter
  copc: Copc
  filepath: string
  deep?: boolean
  maxThreads?: number
}
export const nodeParser: Check.Parser<
  nodeParserParams,
  AllNodesChecked
> = async ({
  get,
  copc,
  filepath,
  deep = false,
  maxThreads,
}: nodeParserParams) => ({
  source: await readPointDataRecords({
    nodes: await loadAllHierarchyPages(get, copc),
    filepath,
    deep,
    maxThreads,
  }),
  suite: pointDataSuite,
})

export default nodeParser

// ========== UTILITIES ============
type readPointDataRecords = {
  nodes: Hierarchy.Node.Map
  filepath: string
  deep: boolean
  maxThreads?: number
}
export const readPointDataRecords = async ({
  nodes,
  filepath,
  deep,
  maxThreads,
}: readPointDataRecords): Promise<AllNodesChecked> => {
  const piscina = new Piscina({
    filename: resolve(__dirname, 'worker.js'),
    maxThreads,
    idleTimeout: 100,
    useAtomics: false, // threads dont communicate between themselves
  })
  return Object.fromEntries(
    await Promise.all(
      Object.entries(nodes).map(
        async ([key, node]) => await piscina.run({ filepath, key, node, deep }),
      ),
    ),
  ) //as AllNodesChecked
}
