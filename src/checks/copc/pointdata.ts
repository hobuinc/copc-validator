import { Statuses } from 'checks'
import { Bounds, Copc, Hierarchy, Key, Point } from 'copc'
import { Check } from 'types'

export type pointDataParams = { copc: Copc; nodeMap: enhancedNodeMap }
/**
 * Check.Suite that works with either a shallowNodeMap or deepNodeMap,
 * used in src/checks/copc/nodes.ts
 */
export const pointData: Check.Suite<pointDataParams> = {
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
  }) => {
    const bound = createBounds(cube, min, max)
    return checkBounds(nodeMap, bound)
  },
  gpsTime: ({
    copc: {
      info: { gpsTimeRange },
    },
    nodeMap,
  }) => checkGpsTime(nodeMap, gpsTimeRange),
  returnNumber: ({ nodeMap }) => checkReturnNumber(nodeMap),
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
    ? Statuses.failureWithInfo(`Points out of bounds: [${badNodes}]`)
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
  return badNodes.length > 0
    ? Statuses.failureWithInfo(`GpsTime out of bounds: [ ${badNodes} ]`)
    : Statuses.success
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

const min = Math.min
const max = Math.max
const createBounds = (
  [lX, lY, lZ, uX, uY, uZ]: Bounds,
  [minX, minY, minZ]: Point,
  [maxX, maxY, maxZ]: Point,
): Bounds => [
  min(lX, minX),
  min(lY, minY),
  min(lZ, minZ),
  max(uX, maxX),
  max(uY, maxY),
  max(uZ, maxZ),
  // max(lX, minX),
  // max(lY, minY),
  // max(lZ, minZ),
  // min(uX, maxX),
  // min(uY, maxY),
  // min(uZ, maxZ),
]

// =========== TYPES ===========
// My version(s) of Hierarchy.Node.Map with point data tacked on
type NodeMap<P> = Record<string, Hierarchy.Node & P>
export type shallowNodeMap = NodeMap<{ root: Record<string, number> }>
export type deepNodeMap = NodeMap<{ points: Record<string, number>[] }>
export type enhancedNodeMap = shallowNodeMap | deepNodeMap
const isDeepMap = (d: enhancedNodeMap): d is deepNodeMap =>
  'points' in Object.values(d)[0]
const isShallowMap = (d: enhancedNodeMap): d is shallowNodeMap =>
  'root' in Object.values(d)[0]
export const enhancedNodeMap = {
  isDeepMap,
  isShallowMap,
}

export type pointChecker = (d: Record<string, number>) => boolean
export type multiPointChecker = (d: Record<string, number>[]) => boolean

// different version of enhancedNodeMap that works better for check functions
type getBadNodesMap = Record<
  string,
  Hierarchy.Node &
    ({ root: Record<string, number> } | { points: Record<string, number>[] })
>
