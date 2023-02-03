import { Hierarchy, Key } from 'copc'
import difference from 'lodash.difference'
import { Check, AllNodesChecked } from '../types/index.js'
import { Statuses } from '../utils/index.js'

export type pointDataSuiteSource = {
  data: AllNodesChecked
  nonZero: string[]
  allNodes?: Hierarchy.Node.Map
}
/**
 * Suite of Check Functions for parsing the checks returned by Workers (from
 * ./parsers/nodes.ts). The first set of functions are each for checking the
 * different Check `id`s in each object across all the Nodes. And below, there
 * are other (currently one) check functions for the AllNodesChecked object
 */
export const pointDataSuite: Check.Suite<pointDataSuiteSource> = {
  // parse data from src/parsers/worker.js (through nodes.ts)
  rgb: {
    function: ({ data, nonZero }) => {
      const badNodes = badNodesFromChecks(data, 'rgb')
      if (badNodes.length > 0)
        return data[badNodes[0]].rgb === 'fail' //pdrf === 6
          ? Statuses.failureWithInfo(
              `(PDRF 6) RGB data found in: ${nodeString(badNodes, nonZero)}`,
            )
          : Statuses.warningWithInfo(
              `(PDRF 7,8) Unutilized RGB bytes found in: ${nodeString(
                badNodes,
                nonZero,
              )}`,
            )
      return Statuses.success
    },
    description: 'RGB values are undefined for PDRF 6, or defined for PDRF 7,8',
  },
  rgbi: {
    function: ({ data, nonZero }) => {
      const badNodes = badNodesFromChecks(data, 'rgbi')
      if (badNodes.length > 0) {
        if (data[badNodes[0]].rgbi === 'warn')
          return badNodes.length === nonZero.length
            ? Statuses.warningWithInfo(
                'All Nodes contain 8-bit RGBI data. Should be scaled to 16-bit.',
              )
            : Statuses.success
        // better way to check this?
        else
          return Statuses.failureWithInfo(
            `Invalid RGB data: ${nodeString(badNodes, nonZero)}`,
          )
      }
      return Statuses.success
    },
    description: 'RGBI values are scaled to 16-bit, if present',
  },
  xyz: {
    function: ({ data }) => {
      const badNodes = badNodesFromChecks(data, 'xyz')
      if (badNodes.length > 0)
        return Statuses.failureWithInfo(`Points out of bounds: [ ${badNodes} ]`)
      return Statuses.success
    },
    description: 'XYZ values are within COPC info cube bounds',
  },
  gpsTime: {
    function: ({ data, nonZero }) => {
      const badNodes = badNodesFromChecks(data, 'gpsTime')
      if (badNodes.length > 0)
        return Statuses.failureWithInfo(
          `GpsTime out of bounds: ${nodeString(badNodes, nonZero)}`,
        )
      return Statuses.success
    },
    description: 'GpsTime values are within COPC info gpsTimeRange bounds',
  },
  sortedGpsTime: {
    function: ({ data, nonZero }) => {
      const warnNodes = badNodesFromChecks(data, 'sortedGpsTime')
      if (warnNodes.length > 0)
        return Statuses.warningWithInfo(
          `GpsTime is unsorted: ${nodeString(warnNodes, nonZero)}`,
        )
      return Statuses.success
    },
    description:
      'GpsTime values are sorted, per node (only works on Deep scan)',
  },
  returnNumber: {
    function: ({ data }) => {
      const badNodes = badNodesFromChecks(data, 'returnNumber')
      if (badNodes.length > 0)
        return Statuses.failureWithInfo(`Invalid data in: [ ${badNodes} ]`)
      return Statuses.success
    },
    description: 'ReturnNumber value is less than NumberOfReturns value',
  },
  zeroPoint: {
    function: ({ data }) => {
      const zeroPointNodes = badNodesFromChecks(data, 'zeroPoints')
      if (zeroPointNodes.length > 0)
        return Statuses.warningWithInfo(
          `Zero Point Nodes: [ ${zeroPointNodes} ]`,
        )
      return Statuses.success
    },
    description: 'Warns with list of nodes containing zero (0) points',
  },
  // other Node checks
  nodesReachable: {
    function: ({ data, allNodes }) => checkNodesReachable(allNodes || data),
    description: 'All nodes in Hierarchy are reachable by key traversal',
  },
  pointsReachable: {
    function: ({ data, allNodes }) => checkPointsReachable(allNodes || data),
    description:
      'All points in Hierarchy are reachable by offset + length traversal',
  },
}

// ========== CHECK FUNCTION ==========

export const checkNodesReachable = (
  nodes: Hierarchy.Node.Map,
): Check.Status => {
  const keys = Object.keys(nodes).map((s) => Key.create(s))

  const traverseChildNodes = (key: Key) => {
    keys.splice(
      keys.findIndex((k) => keyCompare(key, k)),
      1,
    ) // remove key

    if (keys.length === 0) return // finished traversing

    // build all possible steps from here
    const D = key[0] + 1
    const X = key[1] * 2
    const Y = key[2] * 2
    const Z = key[3] * 2
    const possibleChildren = [
      [D, X, Y, Z],
      [D, X + 1, Y, Z],
      [D, X, Y + 1, Z],
      [D, X, Y, Z + 1],
      [D, X + 1, Y + 1, Z],
      [D, X, Y + 1, Z + 1],
      [D, X + 1, Y, Z + 1],
      [D, X + 1, Y + 1, Z + 1],
    ] as Key[]

    possibleChildren.forEach((k) => {
      if (keys.find((l) => keyCompare(k, l))) {
        // if a child from here is found, go there next
        traverseChildNodes(k)
      }
    })
  }

  // start traversal at 0-0-0-0
  traverseChildNodes([0, 0, 0, 0])
  if (keys.length > 0)
    return Statuses.failureWithInfo(
      `Unreachable Nodes in Hierarchy: [ ${keys.map((k) => Key.toString(k))} ]`,
    )
  return Statuses.success
}

// type NodeMapEntry = [string, Hierarchy.Node]
// const checkPointsReachable = (nodes: Hierarchy.Node.Map): Check.Status => {
//   const entries = Object.entries(nodes)
//   // const visited: string[] = []

//   const findNextOffset = (node: Hierarchy.Node, index: number) => {
//     // visited.push(key)
//     entries.splice(index, 1)
//     // console.log(entries.length)
//     const next = entries.findIndex(
//       ([, n]) =>
//         typeof n !== 'undefined' &&
//         node.pointDataOffset + node.pointDataLength === n.pointDataOffset,
//     )
//     //couldn't find next chunk
//     if (!next) return
//     findNextOffset(entries[next][1] as Hierarchy.Node, next)
//   }

//   let startIndex = 0
//   const start = entries.reduce(
//     (lowest, [, node], index) => {
//       if (
//         !node ||
//         node.pointDataOffset > lowest.pointDataOffset ||
//         node.pointDataOffset === 0
//       )
//         return lowest
//       startIndex = index
//       return node
//     },
//     { pointDataOffset: Infinity } as Hierarchy.Node,
//   )
//   console.log(start, startIndex)
//   findNextOffset(start, startIndex)
//   // if (visited.length < entries.length)
//   if (entries.length > 0)
//     return Statuses.failureWithInfo(
//       `Unreachable point data: [ ${entries.map(([k]) => k)} ]`,
//     )

//   return Statuses.success
// }
type NodeMapEntry = [string, Hierarchy.Node]
const checkPointsReachable = (nodes: Hierarchy.Node.Map): Check.Status => {
  const entries = Object.entries(nodes)
  const visited: string[] = []

  const findNextOffset = ([key, node]: NodeMapEntry) => {
    visited.push(key)
    const next = entries.find(
      ([, n]) =>
        typeof n !== 'undefined' &&
        node.pointDataOffset + node.pointDataLength === n.pointDataOffset,
    )
    //couldn't find next chunk
    if (!next) return
    findNextOffset(next as NodeMapEntry)
  }

  const start = entries.reduce<NodeMapEntry>(
    ([k, lowest], [key, node]) => {
      if (
        !node ||
        node.pointDataOffset > lowest.pointDataOffset ||
        node.pointDataOffset === 0
      )
        return [k, lowest]
      return [key, node]
    },
    ['', { pointDataOffset: Infinity } as Hierarchy.Node],
  )
  // console.log(start)
  findNextOffset(start)
  if (visited.length < entries.length)
    return Statuses.failureWithInfo(
      `Unreachable point data: [ ${difference(Object.keys(nodes), visited)} ]`,
    )

  return Statuses.success
}
// ========== UTILITIES ==========
/**
 *
 * @param nodes
 * @param id
 * @returns
 */
const badNodesFromChecks = (nodes: AllNodesChecked, id: string): string[] => {
  const acc: string[] = []
  for (const key in nodes) {
    if (nodes[key][id] === 'warn' || nodes[key][id] === 'fail') acc.push(key)
  }
  return acc
}
//faster than Object.entries.reduce

/**
 *
 * @param bad
 * @param nonZero
 * @returns
 */
export const nodeString = (bad: string[], nonZero: string[]) =>
  `[ ${
    bad.length === nonZero.length
      ? 'ALL-NODES'
      : nonZero.length - bad.length === 1
      ? 'ALL-BUT-ONE-NODE: ' + difference(nonZero, bad)
      : bad
  } ]` // TODO: Is this better than a massive string of >13000 node keys?

const keyCompare = (a: Key, b: Key): boolean =>
  a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3]
