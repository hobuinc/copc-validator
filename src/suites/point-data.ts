import { Key, Step } from 'copc'
import { difference } from 'lodash'
import { Check, AllNodesChecked } from 'types'
import { Statuses } from 'utils'
// ========== point-data.js PARSER ==========

/**
 *
 */
export const pointDataSuite: Check.Suite<AllNodesChecked> = {
  // parse data from src/parsers/worker.js (through nodes.ts)
  rgb: (data) => {
    const badNodes = filterAllNodeChecks(data, 'rgb')
    if (badNodes.length > 0)
      return data[badNodes[0]].rgb === 'fail' //pdrf === 6
        ? Statuses.failureWithInfo(
            `(PDRF 6) RGB data found at: [ ${badNodes} ]`,
          )
        : Statuses.warningWithInfo(
            `(PDRF 7,8) Unutilized RGB data found at: [ ${badNodes} ]`,
          )
    return Statuses.success
  },
  rgbi: (data) => {
    const badNodes = filterAllNodeChecks(data, 'rgbi')
    if (badNodes.length > 0) {
      if (data[badNodes[0]].rgbi === 'warn')
        return badNodes.length === nonZeroNodes(data).length
          ? Statuses.warningWithInfo(
              'All Nodes contain 8-bit RGBI data. Should be scaled to 16-bit.',
            )
          : Statuses.success
      // better way to check this?
      else
        return Statuses.failureWithInfo(
          `Invalid RGB data: ${nodeString(badNodes, nonZeroNodes(data))}`,
        )
    }
    return Statuses.success
  },
  xyz: (data) => {
    const badNodes = filterAllNodeChecks(data, 'xyz')
    if (badNodes.length > 0)
      return Statuses.failureWithInfo(`Points out of bounds: [ ${badNodes} ]`)
    return Statuses.success
  },
  gpsTime: (data) => {
    const badNodes = filterAllNodeChecks(data, 'gpsTime')
    if (badNodes.length > 0)
      return Statuses.failureWithInfo(
        `GpsTime out of bounds: ${nodeString(badNodes, nonZeroNodes(data))}`,
      )
    return Statuses.success
  },
  sortedGpsTime: (data) => {
    const badNodes = filterAllNodeChecks(data, 'sortedGpsTime')
    if (badNodes.length > 0)
      return Statuses.warningWithInfo(
        `GpsTime is unsorted: ${nodeString(badNodes, nonZeroNodes(data))}`,
      )
    return Statuses.success
  },
  returnNumber: (data) => {
    const badNodes = filterAllNodeChecks(data, 'returnNumber')
    if (badNodes.length > 0)
      return Statuses.failureWithInfo(`Invalid data in: [ ${badNodes} ]`)
    return Statuses.success
  },
  // other Node checks
  nodesReachable: (data) => checkNodesReachable(data),
}

export default pointDataSuite

// ========== CHECK FUNCTION ==========

export const checkNodesReachable = (nodes: AllNodesChecked) => {
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

// ========== UTILITIES ==========

const filterAllNodeChecks = (nodes: AllNodesChecked, id: string): string[] =>
  Object.entries(nodes).reduce<string[]>(
    (prev, [key, data]) => (data[id] === 'pass' ? [...prev] : [...prev, key]),
    [],
  )

const nonZeroNodes = (nodes: AllNodesChecked): string[] =>
  Object.entries(nodes).reduce<string[]>(
    (prev, [key, d]) => (d.pointCount === 0 ? [...prev] : [...prev, key]),
    [],
  )

const nodeString = (bad: string[], nonZero: string[]) =>
  `[ ${
    bad.length === nonZero.length
      ? 'ALL-NODES'
      : nonZero.length - bad.length === 1
      ? 'ALL-BUT-ONE-NODE: ' + difference(nonZero, bad)
      : bad
  } ]` // TODO: Is this better than a massive string of >13000 node keys?
