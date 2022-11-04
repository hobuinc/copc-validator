import { Key } from 'copc'
import { difference } from 'lodash'
import { Check, AllNodesChecked } from 'types'
import { Statuses } from 'utils'
// ========== point-data.js PARSER ==========

/**
 *
 */
export const pointDataSuite: Check.Suite<{
  data: AllNodesChecked
  nonZero: string[]
}> = {
  // parse data from src/parsers/worker.js (through nodes.ts)
  rgb: ({ data, nonZero }) => {
    const badNodes = filterAllNodeChecks(data, 'rgb')
    if (badNodes.length > 0)
      return data[badNodes[0]].rgb === 'fail' //pdrf === 6
        ? Statuses.failureWithInfo(
            `(PDRF 6) RGB data found in: [ ${nodeString(badNodes, nonZero)} ]`,
          )
        : Statuses.warningWithInfo(
            `(PDRF 7,8) Unutilized RGB bytes found in: [ ${nodeString(
              badNodes,
              nonZero,
            )} ]`,
          )
    return Statuses.success
  },
  rgbi: ({ data, nonZero }) => {
    const badNodes = filterAllNodeChecks(data, 'rgbi')
    // console.log(badNodes)
    // console.log(nonZeroNodes(data))
    if (badNodes.length > 0) {
      if (data[badNodes[0]].rgbi === 'warn')
        return badNodes.length === nonZero /*Nodes(data)*/.length
          ? Statuses.warningWithInfo(
              'All Nodes contain 8-bit RGBI data. Should be scaled to 16-bit.',
            )
          : Statuses.success
      // better way to check this?
      else
        return Statuses.failureWithInfo(
          `Invalid RGB data: ${nodeString(badNodes, nonZero /*Nodes(data)*/)}`,
        )
    }
    return Statuses.success
  },
  xyz: ({ data }) => {
    const badNodes = filterAllNodeChecks(data, 'xyz')
    if (badNodes.length > 0)
      return Statuses.failureWithInfo(`Points out of bounds: [ ${badNodes} ]`)
    return Statuses.success
  },
  gpsTime: ({ data, nonZero }) => {
    const badNodes = filterAllNodeChecks(data, 'gpsTime')
    if (badNodes.length > 0)
      return Statuses.failureWithInfo(
        `GpsTime out of bounds: ${nodeString(
          badNodes,
          nonZero /*Nodes(data)*/,
        )}`,
      )
    return Statuses.success
  },
  sortedGpsTime: ({ data, nonZero }) => {
    const warnNodes = filterAllNodeChecks(data, 'sortedGpsTime')
    if (warnNodes.length > 0)
      return Statuses.warningWithInfo(
        `GpsTime is unsorted: ${nodeString(
          warnNodes,
          nonZero /*Nodes(data)*/,
        )}`,
      )
    return Statuses.success
  },
  returnNumber: ({ data }) => {
    const badNodes = filterAllNodeChecks(data, 'returnNumber')
    if (badNodes.length > 0)
      return Statuses.failureWithInfo(`Invalid data in: [ ${badNodes} ]`)
    return Statuses.success
  },
  zeroPoint: ({ data }) => {
    const zeroPointNodes = filterAllNodeChecks(data, 'zeroPoints')
    if (zeroPointNodes.length > 0)
      return Statuses.warningWithInfo(`Zero Point Nodes: [ ${zeroPointNodes} ]`)
    return Statuses.success
  },
  // other Node checks
  nodesReachable: ({ data }) => checkNodesReachable(data),
}

export default pointDataSuite

// ========== CHECK FUNCTION ==========
// Key.compare
// function compare(a: Key, b: Key) {
// 	if (a[0] < b[0]) return -1
// 	if (a[0] > b[0]) return 1

// 	for (let i = 0; i < a.length; ++i) {
// 		if (a[i] < b[i]) return -1
// 		if (a[i] > b[i]) return 1
// 	}
// 	return 0
// }
const keyCompare = (a: Key, b: Key): boolean =>
  a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3]

export const checkNodesReachable = (nodes: AllNodesChecked) => {
  const keys = Object.keys(nodes).map((s) => Key.create(s))

  const traverseNodes = (key: Key) => {
    keys.splice(
      keys.findIndex((k) => keyCompare(key, k) /*Key.compare(key, k) === 0*/),
      1,
    ) // remove key

    if (keys.length === 0) return // finished traversing

    // build all possible steps from here
    // const [d, x, y, z] = key
    const D = key[0] + 1 //d + 1
    const X = key[1] * 2 //x * 2
    const Y = key[2] * 2 //y * 2
    const Z = key[3] * 2 //z * 2
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
      if (keys.find((l) => keyCompare(k, l) /*Key.compare(k, l) === 0*/)) {
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

// ========== UTILITIES ==========
/**
 *
 * @param nodes
 * @param id
 * @returns
 */
const filterAllNodeChecks = (nodes: AllNodesChecked, id: string): string[] =>
  Object.entries(nodes).reduce<string[]>((acc, [key, data]) => {
    if (data[id] === 'warn' || data[id] === 'fail') acc.push(key)
    return acc
  }, [])
// const filterAllNodeChecks = (nodes: AllNodesChecked, id: string): string[] =>
//   Object.entries(nodes).reduce<string[]>(
//     (prev, [key, data]) =>
//       data[id] === 'pass' || data[id] === undefined // ignore undefined to warn about zero point nodes
//         ? [...prev]
//         : [...prev, key],
//     [],
//   )

// export const nonZeroNodes = (nodes: AllNodesChecked): string[] =>
//   Object.entries(nodes).reduce<string[]>(
//     (prev, [key, d]) => (d.pointCount === 0 ? [...prev] : [...prev, key]),
//     [],
//   )

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
