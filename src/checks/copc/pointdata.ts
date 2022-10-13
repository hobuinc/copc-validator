import { invokeAllChecks, Statuses } from 'checks'
import { Copc, Getter, Hierarchy, Point } from 'copc'
import { Check } from 'types'

/**
 * Check.Suite that works with either a shallowNodeMap or deepNodeMap,
 * used in src/checks/copc/nodes.ts
 */
export const pointData: Check.Suite<{
  copc: Copc
  nodeMap: enhancedNodeMap
}> = {
  rgb: ({ copc: { header }, nodeMap }) =>
    checkRgb(nodeMap, header.pointDataRecordFormat as 6 | 7 | 8),
  rgbi: ({ copc: { header }, nodeMap }) =>
    checkRgbi(nodeMap, header.pointDataRecordFormat as 6 | 7 | 8),
  xyz: ({
    copc: {
      header: { min, max },
      info: { cube },
    },
    nodeMap,
  }) => checkXyz(nodeMap, min, max, cube),
  gpsTime: ({
    copc: {
      info: { gpsTimeRange },
    },
    nodeMap,
  }) => checkGpsTime(nodeMap, gpsTimeRange),
  returns: ({ nodeMap }) => {
    const badPoints = getBadNodes(
      nodeMap,
      (d) =>
        typeof d.ReturnNumber === 'undefined' ||
        typeof d.NumberOfReturns === 'undefined' ||
        d.ReturnNumber > d.NumberOfReturns,
    )
    return badPoints.length > 0
      ? Statuses.failureWithInfo(
          `Invalid points found at: [ ${badPoints.join(', ')} ]`,
        )
      : Statuses.success
  },
}
// ========== POINT DATA CHECKS ==========
const checkRgb = (nodeMap: enhancedNodeMap, pdrf: 6 | 7 | 8): Check.Status => {
  if (pdrf === 6) {
    const badNodes = getBadNodes(
      nodeMap,
      (d) =>
        typeof d.Red !== 'undefined' ||
        typeof d.Green !== 'undefined' ||
        typeof d.Blue !== 'undefined',
    )
    return badNodes.length > 0
      ? Statuses.failureWithInfo(`(PDRF: 6) RGB data found at: [ ${badNodes} ]`)
      : { status: 'pass' }
  }
  const badNodes = getBadNodes(
    nodeMap,
    (d) =>
      typeof d.Red === 'undefined' ||
      typeof d.Green === 'undefined' ||
      typeof d.Blue === 'undefined' ||
      (d.Red === 0 && d.Green === 0 && d.Blue === 0),
  )
  return badNodes.length > 0
    ? Statuses.warningWithInfo(
        `(PDRF: ${pdrf}) Unutilized RGB data found at: [ ${badNodes} ]`,
      )
    : Statuses.success
}

const checkRgbi = (nodeMap: enhancedNodeMap, pdrf: 6 | 7 | 8): Check.Status => {
  const hasRgb = pdrf !== 6
  if (hasRgb) {
    const badPoints = getBadNodes(
      nodeMap,
      (d) =>
        typeof d.Red === 'undefined' ||
        typeof d.Green === 'undefined' ||
        typeof d.Blue === 'undefined',
    )
    if (badPoints.length > 0)
      return Statuses.failureWithInfo(`Invalid RGB data at: [ ${badPoints} ]`)
  }
  const warnPoints = getBadNodes(
    nodeMap,
    hasRgb
      ? (d) =>
          d.Red! <= 255 &&
          d.Green! <= 255 &&
          d.Blue! <= 255 &&
          d.Intensity! <= 255
      : (d) => d.Intensity! <= 255,
    true,
  )
  return warnPoints.length === Object.entries(nodeMap).length
    ? Statuses.warningWithInfo(
        `Points appear to contain 8-bit ${
          hasRgb ? 'RGBI' : 'Intensity'
        }. Should be scaled to 16-bit.`,
      )
    : Statuses.success
}

type Cube = [number, number, number, number, number, number]
// TODO: XYZ within node bounds (D-X-Y-Z)
const checkXyz = (
  nodeMap: enhancedNodeMap,
  [xMin, yMin, zMin]: Point,
  [xMax, yMax, zMax]: Point,
  [xMinCube, yMinCube, zMinCube, xMaxCube, yMaxCube, zMaxCube]: Cube,
) => {
  const badNodes = getBadNodes(
    nodeMap,
    (d) =>
      typeof d.X === 'undefined' ||
      typeof d.Y === 'undefined' ||
      typeof d.Z === 'undefined' ||
      d.X < xMin ||
      d.X < xMinCube ||
      d.X > xMax ||
      d.X > xMaxCube ||
      d.Y < yMin ||
      d.Y < yMinCube ||
      d.Y > yMax ||
      d.Y > yMaxCube ||
      d.Z < zMin ||
      d.Z < zMinCube ||
      d.Z > zMax ||
      d.Z > zMaxCube,
  )
  return badNodes.length > 0
    ? Statuses.failureWithInfo(`X, Y, or Z out of bounds: [${badNodes}]`)
    : Statuses.success
}

type gpsTimeRange = [number, number]
export const checkGpsTime = (
  nodeMap: enhancedNodeMap,
  [min, max]: gpsTimeRange,
): Check.Status => {
  const badPoints = getBadNodes(
    nodeMap,
    (d) =>
      typeof d.GpsTime === 'undefined' || d.GpsTime < min || d.GpsTime > max,
  )
  return badPoints.length > 0
    ? Statuses.failureWithInfo(`GpsTime out of bounds: [ ${badPoints} ]`)
    : Statuses.success
}

// ========== UTILITIES ==========

// Uses one `pointChecker` function and runs it on either `root` or on every object
// present in `points` (using `.some()`). Should simplify multiple checks that look
// for bad data on as many points that are provided (e.g. scanning XYZ or RBG values)
/**
 * Takes an `enhancedNodeMap` (result of readHierarchyNodes()) and checks the points
 * of each node with a provided `pointChecker` function. Returns the Keys of any
 * Node that violates the spec.
 * @param {enhancedNodeMap} map `shallowNodeMap` or `deepNodeMap` from readHierarchyNodes()
 * @param {pointChecker} check Function that checks one point (`Record<string, number>`)
 * and returns `true` if that point violates the spec being checked
 * @param {boolean} every If `true`, changes the way `deepNodeMap`s are checked
 * (from `map.points.some((d) => check(d))` to `map.points.every((d) => check(d))`)
 * @returns {string[]} Array of Node Keys that violate the given `check` function
 */
export const getBadNodes = (
  map: Record<
    string,
    Hierarchy.Node &
      ({ root: Record<string, number> } | { points: Record<string, number>[] })
  >,
  check: pointChecker,
  every: boolean = false,
): string[] =>
  Object.entries(map).reduce<string[]>(
    (
      prev,
      [key, { pointCount, pointDataOffset, pointDataLength, ...data }],
    ) => {
      try {
        if (
          'root' in data
            ? check(data.root)
            : every
            ? data.points.every((d) => check(d))
            : data.points.some((d) => check(d))
        )
          return [...prev, key]
      } catch (e) {
        return [...prev, key]
      }
      return [...prev]
    },
    [],
  )

// ========== DEPRECATED ==========

// My first stab at a single function for both deep and shallow scans, but this
// doesn't actually help much since you'd need to check the types ahead of time
// and discriminate the `check` function. So I replaced it with the above function,
// that uses a single `check` with either check(map.root) or map.points.some(check())
// export function getBadNodesDiscriminated<D extends enhancedNodeMap>(
//   map: D,
//   check: D extends shallowNodeMap ? pointChecker : multiPointChecker,
// ): string[]
// export function getBadNodesDiscriminated(
//   map: shallowNodeMap | deepNodeMap,
//   check: pointChecker | multiPointChecker,
// ) {
//   return Object.entries(map).reduce<string[]>(
//     enhancedNodeMap.isShallowMap(map) // following casts allowed thanks to function declaration
//       ? shallowCheckReduce(check as pointChecker)
//       : deepCheckReduce(check as multiPointChecker),
//     [],
//   )
// }
// const shallowCheckReduce =
//   (check: pointChecker) =>
//   (prev: string[], [key, { root }]: [string, shallowNodeScan]) => {
//     try {
//       if (check(root)) return [...prev, key]
//     } catch (e) {
//       return [...prev, key]
//     }
//     return [...prev]
//   }
// const deepCheckReduce =
//   (check: multiPointChecker) =>
//   (prev: string[], [key, { points }]: [string, deepNodeScan]) => {
//     try {
//       if (check(points)) return [...prev, key]
//     } catch (e) {
//       return [...prev, key]
//     }
//     return [...prev]
//   }

// =========== TYPES ===========
export type shallowNodeMap = Record<
  string,
  Hierarchy.Node & { root: Record<string, number> }
>
export type deepNodeMap = Record<
  string,
  Hierarchy.Node & { points: Record<string, number>[] }
>
export type enhancedNodeMap = shallowNodeMap | deepNodeMap
const isDeepMap = (d: enhancedNodeMap): d is deepNodeMap =>
  'points' in Object.values(d)[0] //Object.keys(Object.values(d)[0]).includes('points')
const isShallowMap = (d: enhancedNodeMap): d is shallowNodeMap =>
  'root' in Object.values(d)[0] //Object.keys().includes('root')
export const enhancedNodeMap = {
  isDeepMap,
  isShallowMap,
}

export type pointChecker = (d: Record<string, number>) => boolean
export type multiPointChecker = (d: Record<string, number>[]) => boolean
