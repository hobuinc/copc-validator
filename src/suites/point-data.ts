import { Bounds, Hierarchy, Key, Point } from 'copc'
import { Check, pointDataParams, enhancedNodeMap, pointChecker } from 'types'
import { Statuses } from 'utils'

/**
 * Suite of Check Functions for checking the Point Data Records of Copc files.
 * This suite uses the point data in `enhancedNodeMap`s from `src/parsers/nodes`
 * along with the `Copc` object to ensure the PDR data is valid according to the
 * COPC specifications and `Copc` object data
 */
export const pointDataSuite: Check.Suite<pointDataParams> = {
  rgb: ({ copc: { header }, nodeMap }) =>
    checkRgb(nodeMap, header.pointDataRecordFormat as 6 | 7 | 8),
  rgbi: ({ copc: { header }, nodeMap }) =>
    checkRgbi(nodeMap, header.pointDataRecordFormat as 6 | 7 | 8),
  xyz: ({
    copc: {
      info: { cube },
    },
    nodeMap,
  }) => {
    return checkBounds(nodeMap, cube)
  },
  gpsTime: ({
    copc: {
      info: { gpsTimeRange },
    },
    nodeMap,
  }) => checkGpsTime(nodeMap, gpsTimeRange),
  sortedGpsTime: ({ nodeMap }) => checkGpsTimeSorted(nodeMap),
  returnNumber: ({ nodeMap }) => checkReturnNumber(nodeMap),
}

export default pointDataSuite
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

const checkBounds = (nodeMap: getBadNodesMap, bounds: Bounds) => {
  const check = (key: string, data: Record<string, number>) => {
    const [minx, miny, minz, maxx, maxy, maxz] = Bounds.stepTo(
      bounds,
      Key.parse(key),
    )
    return (
      typeof data.X === 'undefined' ||
      typeof data.Y === 'undefined' ||
      typeof data.Z === 'undefined' ||
      data.X < minx ||
      data.X > maxx ||
      data.Y < miny ||
      data.Y > maxy ||
      data.Z < minz ||
      data.Z > maxz
    )
  }
  // cannot use getBadNodes directly because the check depends on the key
  const badNodes = Object.entries(nodeMap).reduce<string[]>(
    (prev, [key, data]) => {
      if (
        'root' in data
          ? check(key, data.root)
          : data.points.some((d) => check(key, d))
      )
        return [...prev, key]
      return [...prev]
    },
    [],
  )
  return badNodes.length > 0
    ? Statuses.failureWithInfo(`Points out of bounds: [ ${badNodes} ]`)
    : Statuses.success
}

type gpsTimeRange = [number, number]
export const checkGpsTime = (
  nodeMap: enhancedNodeMap,
  [min, max]: gpsTimeRange,
): Check.Status => {
  const badNodes = getBadNodes(
    nodeMap,
    (d) =>
      typeof d.GpsTime === 'undefined' || d.GpsTime < min || d.GpsTime > max,
  )
  if (badNodes.length > 0)
    return Statuses.failureWithInfo(`GpsTime out of bounds: [ ${badNodes} ]`)
  return Statuses.success
}

export const checkGpsTimeSorted = (nodeMap: enhancedNodeMap) => {
  if (enhancedNodeMap.isShallowMap(nodeMap))
    return Statuses.successWithInfo(`Run a deep scan for more information`)
  // cannot use getBadNodes directly since we should redeclare prevGpsTime per node
  const badNodes = Object.entries(nodeMap).reduce<string[]>(
    (prev, [key, data]) => {
      let prevGpsTime: number = 0
      const check: pointChecker = (d) => {
        const isBad = d.GpsTime < prevGpsTime
        prevGpsTime = d.GpsTime
        return isBad
      }
      if (data.points.some(check)) return [...prev, key]
      return [...prev]
    },
    [],
  )
  if (badNodes.length > 0)
    return Statuses.warningWithInfo(`GpsTime is unsorted: [ ${badNodes} ]`)
  return Statuses.success
}

export const checkReturnNumber = (nodeMap: enhancedNodeMap): Check.Status => {
  const badNodes = getBadNodes(
    nodeMap,
    (d) =>
      typeof d.ReturnNumber === 'undefined' ||
      typeof d.NumberOfReturns === 'undefined' ||
      d.ReturnNumber > d.NumberOfReturns,
  )
  return badNodes.length > 0
    ? Statuses.failureWithInfo(`Invalid points found at: [ ${badNodes} ]`)
    : Statuses.success
}

// ========== UTILITIES ==========
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
  map: getBadNodesMap,
  check: pointChecker,
  every: boolean = false,
): string[] =>
  Object.entries(map).reduce<string[]>((prev, [key, data]) => {
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
  }, [])

// different version of enhancedNodeMap that works better for check functions
export type getBadNodesMap = Record<
  string,
  Hierarchy.Node &
    ({ root: Record<string, number> } | { points: Record<string, number>[] })
>
