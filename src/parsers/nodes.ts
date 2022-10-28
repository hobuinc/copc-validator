import PromisePool from '@supercharge/promise-pool'
import { Bounds, Copc, Getter, Hierarchy, Key, Step } from 'copc'
import { map } from 'lodash'
import { resolve } from 'path'
import Piscina from 'piscina'
import { pointDataSuite } from 'suites'
import {
  Check,
  deepNodeMap,
  deepNodeScan,
  nodeScan,
  pointChecker,
  pointDataParams,
  shallowNodeMap,
  shallowNodeScan,
} from 'types'
import { Statuses } from 'utils'

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
  const nodeMap = await readHierarchyNodes(
    get,
    copc,
    filepath,
    deep,
    maxThreads,
  )
  return { source: { copc, nodeMap }, suite: pointDataSuite }
}

export default nodeParser

// ========== UTILITIES ============

/**
 * Utility that neatly wraps `stitchDataToNodes()` with its required output from
 * `scanNodes()` and returns either a shallow or deep Node Map (`./pointdata.ts`),
 * depending on the `deep` parameter provided (with a smart return type)
 * @param get
 * @param copc
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
  get: Getter,
  copc: Copc,
  filepath: string,
  deep: B,
  maxThreads?: number,
): B extends true ? Promise<deepNodeMap> : Promise<shallowNodeMap>
export async function readHierarchyNodes(
  get: Getter,
  copc: Copc,
  filepath: string,
  deep: boolean,
  maxThreads?: number,
) {
  const piscina = new Piscina({
    // name: 'scanNode',
    filename: resolve(__dirname, 'worker.js'),
    maxThreads,
    idleTimeout: 50,
    useAtomics: false, // threads dont communicate between themselves
    // concurrentTasksPerWorker: 2,
    resourceLimits: {
      maxOldGenerationSizeMb: 35,
      maxYoungGenerationSizeMb: 1,
      stackSizeMb: 0.5,
    },
  })
  // console.log(piscina.options)
  const { nodes: n, pages } = await Copc.loadHierarchyPage(
    get,
    copc.info.rootHierarchyPage,
  )
  let nodes: Hierarchy.Node.Map = { ...n }
  for (const key in pages) {
    nodes = {
      ...nodes,
      ...(await Copc.loadHierarchyPage(get, pages[key]!)).nodes,
    }
  }
  const r = stitchDataToNodes(
    nodes,
    await scanNodes(nodes, filepath, piscina, deep),
  )
  // console.log(piscina.runTime)
  return r
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

export const newNodeParser: Check.Parser<
  nodeParserParams,
  AllNodeChecks
> = async ({
  get,
  copc,
  filepath,
  deep = false,
  maxThreads,
}: nodeParserParams) => {
  // Piscina setup
  const piscina = new Piscina({
    filename: resolve(__dirname, 'worker.js'),
    maxThreads,
    idleTimeout: 100,
    useAtomics: false, // threads dont communicate between themselves
  })

  // Read all Hierarchy pages
  const { nodes: n, pages } = await Copc.loadHierarchyPage(
    get,
    copc.info.rootHierarchyPage,
  )
  let nodes: Hierarchy.Node.Map = { ...n }
  for (const key in pages) {
    nodes = {
      ...nodes,
      ...(await Copc.loadHierarchyPage(get, pages[key]!)).nodes,
    }
  }

  // Read a node & check it, loop for all nodes
  const nodeChecks = Object.fromEntries(
    (
      await PromisePool.for(Object.entries(nodes))
        .withConcurrency(100)
        .process(async ([key, node]) => {
          const source = {
            copc,
            key,
            data: (await piscina.run({
              filepath,
              node,
              deep,
            })) as piscinaData,
          }
          const checks = Object.fromEntries(
            map(microPointDataSuite, (f, id) => [id, f(source)]),
          )
          return [key, checks]
        })
    ).results,
  ) as AllNodeChecks

  // convert AllNodeChecks into separate Check.Functions
  return { source: nodeChecks, suite: macroPointDataSuite }
}

type piscinaData = Record<string, number> | Record<string, number>[]
type microPdParams = {
  copc: Copc
  key: string
  data: piscinaData
}
// checks one node at a time
const microPointDataSuite: {
  [id: string]: ({ copc, key, data }: microPdParams) => 'pass' | 'fail' | 'warn'
} = {
  rgb: ({ copc: { header }, data }) =>
    checkRgb(data, header.pointDataRecordFormat as 6 | 7 | 8),
  rgbi: ({ copc: { header }, data }) =>
    checkRgbi(data, header.pointDataRecordFormat as 6 | 7 | 8),
  xyz: ({
    copc: {
      info: { cube },
    },
    data,
    key,
  }) => checkBounds(data, cube, key),
  gpsTime: ({
    copc: {
      info: { gpsTimeRange },
    },
    data,
  }) => checkGpsTime(data, gpsTimeRange),
  sortedGpsTime: ({ data }) => checkGpsTimeSorted(data),
  returnNumber: ({ data }) => checkReturnNumber(data),
}

const filterAllNodeChecks = (nodes: AllNodeChecks, id: string) =>
  Object.entries(nodes).reduce<string[]>(
    (prev, [key, data]) => (data[id] === 'pass' ? [...prev] : [...prev, key]),
    [],
  )

const macroPointDataSuite: Check.Suite<AllNodeChecks> = {
  // filter AllNodeChecks into separate Check.Status objects
  ...Object.keys(microPointDataSuite).reduce(
    (prev, id) => ({
      ...prev,
      [id]: (d: AllNodeChecks) => {
        const badNodes = filterAllNodeChecks(d, id)
        if (badNodes.length > 0)
          return Statuses.failureWithInfo(`[ ${badNodes} ]`)
        return Statuses.success
      },
    }),
    {},
  ),
  // other Node checks
  nodesReachable: (nodes) => checkNodesReachable(nodes),
}

const checkRgb = (data: piscinaData, pdrf: 6 | 7 | 8) => {
  if (pdrf === 6) {
    return checkNode(
      data,
      (d) =>
        typeof d.Red !== 'undefined' ||
        typeof d.Green !== 'undefined' ||
        typeof d.Blue !== 'undefined',
    )
  }
  return checkNode(
    data,
    (d) =>
      typeof d.Red === 'undefined' ||
      typeof d.Green === 'undefined' ||
      typeof d.Blue === 'undefined' ||
      (d.Red === 0 && d.Green === 0 && d.Blue === 0),
  )
}

const checkRgbi = (data: piscinaData, pdrf: 6 | 7 | 8) => {
  const hasRgb = pdrf !== 6
  if (hasRgb) {
    if (
      isBadNode(
        data,
        (d) =>
          typeof d.Red === 'undefined' ||
          typeof d.Green === 'undefined' ||
          typeof d.Blue === 'undefined',
      )
    )
      return 'fail'
  }
  return checkNode(
    data,
    hasRgb
      ? (d) =>
          d.Red! <= 255 &&
          d.Green! <= 255 &&
          d.Blue! <= 255 &&
          d.Intensity! <= 255
      : (d) => d.Intensity! <= 255,
    true,
  )
}

const checkBounds = (data: piscinaData, bounds: Bounds, key: string) => {
  const [minx, miny, minz, maxx, maxy, maxz] = Bounds.stepTo(
    bounds,
    Key.parse(key),
  )
  return checkNode(
    data,
    (d) =>
      typeof d.X === 'undefined' ||
      typeof d.Y === 'undefined' ||
      typeof d.Z === 'undefined' ||
      d.X < minx ||
      d.X > maxx ||
      d.Y < miny ||
      d.Y > maxy ||
      d.Z < minz ||
      d.Z > maxz,
  )
}

type gpsTimeRange = [number, number]
const checkGpsTime = (data: piscinaData, [min, max]: gpsTimeRange) => {
  return checkNode(
    data,
    (d) =>
      typeof d.GpsTime === 'undefined' || d.GpsTime < min || d.GpsTime > max,
  )
}

const checkGpsTimeSorted = (data: piscinaData) => {
  if (!Array.isArray(data)) return 'pass' // cannot check if a single point is sorted
  let prevGpsTime: number = 0
  return checkNode(
    data,
    (d) => {
      const isBad = d.GpsTime < prevGpsTime
      prevGpsTime = d.GpsTime
      return isBad
    },
    true,
  )
}

const checkReturnNumber = (data: piscinaData) => {
  return checkNode(
    data,
    (d) =>
      typeof d.ReturnNumber === 'undefined' ||
      typeof d.NumberOfReturns === 'undefined' ||
      d.ReturnNumber > d.NumberOfReturns,
  )
}

const checkNodesReachable = (nodes: AllNodeChecks) => {
  const keys = Object.keys(nodes).map((s) => Key.create(s))

  const traverseNodes = (key: Key) => {
    // console.log(`Visiting ${Key.toString(key)}`)
    keys.splice(
      keys.findIndex((k) => Key.compare(key, k) === 0),
      1,
    ) // remove key

    if (keys.length === 0) return // finished traversing

    // build all possible steps from here
    const possibleChildren = (
      [
        [0, 0, 0],
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
        [1, 1, 0],
        [0, 1, 1],
        [1, 0, 1],
        [1, 1, 1],
      ] as Step[]
    ).map((s) => Key.step(key, s))

    // console.log(
    //   `Possible children: ${possibleChildren.map((k) => Key.toString(k))}`,
    // )

    possibleChildren.forEach((k) => {
      if (keys.find((l) => Key.compare(k, l) === 0)) {
        // if a child from here is found, go there next
        traverseNodes(k)
      }
    })
  }

  // start traversal at 0-0-0-0
  traverseNodes(Key.parse('0-0-0-0'))
  if (keys.length > 0)
    return Statuses.failureWithInfo(
      `Unreachable Nodes in Hierarchy: [ ${keys.map((k) => Key.toString(k))} ]`,
    )
  return Statuses.success
}

const checkNode = (
  data: piscinaData,
  check: pointChecker,
  warning: boolean = false,
  every: boolean = false,
) => boolToStatus(!isBadNode(data, check, every), warning)

/**
 *
 * @param data
 * @param check
 * @param every
 * @returns `true` if Node violates the specs, `false` if Node checks out OK
 */
const isBadNode = (
  data: piscinaData,
  check: pointChecker,
  every: boolean = false,
): boolean =>
  Array.isArray(data)
    ? every
      ? data.every((d) => check(d))
      : data.some((d) => check(d))
    : check(data)

const boolToStatus = (b: boolean, warning: boolean = false) =>
  b ? 'pass' : warning ? 'warn' : 'fail'

type NodeCheck = { [id: string]: 'pass' | 'fail' | 'warn' }
type AllNodeChecks = { [key: string]: NodeCheck }
