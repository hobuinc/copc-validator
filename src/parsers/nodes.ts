import { Copc, Hierarchy, Getter } from 'copc'
import { pointDataSuite, pointDataSuiteSource } from '../suites/index.js'
import { Check, AllNodesChecked } from '../types/index.js'
import {
  loadAllHierarchyPages,
  NodeVsBrowser,
  runTasks,
  workerParams,
} from '../utils/index.js'
import sample from 'lodash.samplesize'

export type nodeParserParams = {
  get: Getter
  copc: Copc
  file: string | File
  deep?: boolean
  workerCount?: number
  queueLimit?: number
  sampleSize?: number
  showProgress?: boolean
}
export const nodeParser: Check.Parser<
  nodeParserParams,
  pointDataSuiteSource //{ data: AllNodesChecked; nonZero: string[]; allNodes?: Hierarchy.Node.Map }
> = async ({
  get,
  copc,
  file,
  deep = false,
  workerCount,
  queueLimit,
  sampleSize,
  showProgress = false,
}: nodeParserParams) => {
  const nodes = await loadAllHierarchyPages(get, copc)
  return {
    source: await createPointDataSuiteSource(
      { nodes, file, copc },
      { deep, workerCount, queueLimit, sampleSize, withBar: showProgress },
    ),
    suite: pointDataSuite,
  }
}

// ========== A MESSY NEST OF UTILITIES ============
const { lazPerf } = NodeVsBrowser
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
  file: string | File
  copc: Copc
  deep: boolean
  workerCount?: number
  queueLimit?: number
}
/**
 *
 * @param params readPDRsParams object
 * @param withBar Turns `cli-progress` bar On (true) or Off (false)
 * @returns
 */
export const readPointDataRecords = (
  { nodes, file, copc, deep, workerCount, queueLimit }: readPDRsParams,
  withBar = false,
): Promise<AllNodesChecked> => {
  return runTasks(
    // turn Hierarchy.Node.Map into Array of Worker tasks
    Object.entries(nodes).map(([key, node]) => ({
      file,
      key,
      node: node || { pointCount: 0, pointDataOffset: 0, pointDataLength: 0 },
      copc,
      lazPerfWasmFilename: lazPerf,
    })),
    { deep, withBar, workerCount, queueLimit },
  )
}

type createPointDataSuiteSourceData = {
  nodes: Hierarchy.Node.Map
  file: string | File
  copc: Copc
}
type createPointDataSuiteSourceOptions = {
  deep: boolean
  workerCount?: number
  queueLimit?: number
  withBar?: boolean
  sampleSize?: number
}
/**
 * Should be more performant than using readPointDataRecords as it collects the
 * nonZero nodes while building the workerParams array
 * @param param0
 * @param param1
 * @returns
 */
const createPointDataSuiteSource = async (
  { nodes, file, copc }: createPointDataSuiteSourceData,
  {
    deep,
    workerCount,
    queueLimit,
    sampleSize,
    withBar = false,
  }: createPointDataSuiteSourceOptions,
) => {
  const nodeEntries = Object.entries(nodes)
  const [nonZero, data] = nodeEntries.reduce<[string[], workerParams[]]>(
    (acc, [key, node]) => {
      if (node && node.pointCount !== 0) acc[0].push(key)
      acc[1].push({
        file,
        key,
        node: node || { pointCount: 0, pointDataOffset: 0, pointDataLength: 0 },
        copc,
        lazPerfWasmFilename: lazPerf,
      })
      return acc
    },
    [[], []],
  )
  if (!sampleSize)
    return {
      data: await runTasks(data, {
        deep,
        withBar,
        workerCount,
        queueLimit,
      }),
      nonZero,
    }

  if (sampleSize < 1) sampleSize = 1
  // unneccesary since _.sample will return the full array if size > length
  // if(sampleSize > entries.length) sampleSize = entries.length
  // but we want to compare anyway and only warn if sample is less than entire node set
  if (sampleSize < nodeEntries.length)
    console.warn(
      `The following report is NOT a comprehensive validation of all the data in the Point Data Records. The validator has randomly selected ${sampleSize} nodes out of a possible ${nodeEntries.length}.`,
    )
  return {
    data: await runTasks(sample(data, sampleSize), {
      deep,
      withBar,
      workerCount,
      queueLimit,
    }),
    nonZero,
    allNodes: nodes,
  }
}
