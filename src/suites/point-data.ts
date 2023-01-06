import { Hierarchy, Key } from 'copc'
import difference from 'lodash.difference'
import { Check, AllNodesChecked } from '../types/index.js'
import { Statuses } from '../utils/index.js'

/**
 * Suite of Check Functions for parsing the checks returned by Workers (from
 * ./parsers/nodes.ts). The first set of functions are each for checking the
 * different Check `id`s in each object across all the Nodes. And below, there
 * are other (currently one) check functions for the AllNodesChecked object
 */
export const pointDataSuite: Check.Suite<{
  data: AllNodesChecked
  nonZero: string[]
}> = {
  // parse data from src/parsers/worker.js (through nodes.ts)
  rgb: {
    function: ({ data, nonZero }) => {
      const badNodes = badNodesFromChecks(data, 'rgb')
      if (badNodes.length > 0)
        return data[badNodes[0]].rgb === 'fail' //pdrf === 6
          ? Statuses.failureWithInfo(
              `(PDRF 6) RGB data found in: [ ${nodeString(
                badNodes,
                nonZero,
              )} ]`,
            )
          : Statuses.warningWithInfo(
              `(PDRF 7,8) Unutilized RGB bytes found in: [ ${nodeString(
                badNodes,
                nonZero,
              )} ]`,
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
    description: 'GpsTime values are sorted, per node',
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
    function: ({ data }) => checkNodesReachable(data),
    description: 'All nodes in Hierarchy are reachable by key traversal',
  },
}

// ========== CHECK FUNCTION ==========

export const checkNodesReachable = (nodes: AllNodesChecked) => {
  const keys = Object.keys(nodes).map((s) => Key.create(s))

  const traverseNodes = (key: Key) => {
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
        traverseNodes(k)
      }
    })
  }

  // start traversal at 0-0-0-0
  traverseNodes([0, 0, 0, 0])
  if (keys.length > 0)
    return Statuses.failureWithInfo(
      `Unreachable Nodes in Hierarchy: [ ${keys.map((k) => Key.toString(k))} ]`,
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
