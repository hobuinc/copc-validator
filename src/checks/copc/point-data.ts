import { Copc, Point } from 'copc'
import { isEqual, reduce } from 'lodash'
import { Check } from 'types'
import { enhancedWithRootPoint } from './common'
import { Statuses } from '../../checks'

export const pointData: Check.Suite<{
  copc: Copc
  pd: enhancedWithRootPoint<any>
}> = {
  rgb: ({ copc, pd }) =>
    checkRgb(pd, copc.header.pointDataRecordFormat as 6 | 7 | 8),
  rgbi: ({ copc, pd }) =>
    checkRgbi(pd, copc.header.pointDataRecordFormat as 6 | 7 | 8),
  xyz: ({
    copc: {
      header: { min, max },
      info: { cube },
    },
    pd,
  }) => checkXyz(pd, min, max, cube),
  gpsTime: ({
    copc: {
      info: { gpsTimeRange },
    },
    pd,
  }) => checkGpsTime(pd, gpsTimeRange),
  returns: ({ pd }) => {
    const badPoints = getBadPoints(
      pd,
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

export default pointData

// ===== CHECKS =====
const checkRgb = <T extends object = any>(
  points: enhancedWithRootPoint<T>,
  pdrf: 6 | 7 | 8,
): Check.Status => {
  const pointData = reduceDimensions(points, ['Red', 'Green', 'Blue'])
  if (pdrf === 6) {
    const badRootPoints = getReducedBadPoints(pointData, (d) => !isEqual(d, {}))
    return badRootPoints.length > 0
      ? Statuses.failureWithInfo(
          `(PDRF: 6) RGB data found at: ${badRootPoints.join(', ')}`,
        )
      : { status: 'pass' }
  }
  // else
  const badRootPoints = getReducedBadPoints(
    pointData,
    (d) => isEqual(d, {}) || isEqual(d, { Red: 0, Green: 0, Blue: 0 }),
  )
  return badRootPoints.length > 0
    ? Statuses.warningWithInfo(
        `(PDRF: ${pdrf}) Unutilized RGB data found at: [ ${badRootPoints.join(
          ', ',
        )} ]`,
      )
    : Statuses.success
}

const checkRgbi = <T extends object = any>(
  pointData: enhancedWithRootPoint<T>,
  pdrf: 6 | 7 | 8,
): Check.Status => {
  // const pointData = reduceDimensions(points, [
  //   'Red',
  //   'Green',
  //   'Blue',
  //   'Intensity',
  // ])
  const hasRgb = pdrf !== 6
  if (hasRgb) {
    const badPoints = getBadPoints(
      pointData,
      (d) =>
        typeof d.Red === 'undefined' ||
        typeof d.Green === 'undefined' ||
        typeof d.Blue === 'undefined',
    )
    if (badPoints.length > 0)
      return Statuses.failureWithInfo(
        `Invalid RGB data at: [ ${badPoints.join(', ')} ]`,
      )
  }
  const warnPoints = getBadPoints(
    pointData,
    hasRgb
      ? (d) =>
          d.Red! <= 255 &&
          d.Green! <= 255 &&
          d.Blue! <= 255 &&
          d.Intensity! <= 255
      : (d) => d.Intensity! <= 255,
  )
  return warnPoints.length === Object.entries(pointData).length
    ? Statuses.warningWithInfo(
        `Points appear to contain 8-bit ${
          hasRgb ? 'RGBI' : 'Intensity'
        }. Should be scaled to 16-bit.`,
      )
    : Statuses.success
}

// TODO: XYZ within node cube (based on D-X-Y-Z key)
const checkXyz = <T extends object = any>(
  pointData: enhancedWithRootPoint<T>,
  [xMin, yMin, zMin]: Point,
  [xMax, yMax, zMax]: Point,
  cube: [number, number, number, number, number, number],
): Check.Status => {
  // const pointData = reduceDimensions(points, ['X', 'Y', 'Z'])
  // const [xMin, yMin, zMin] = min
  // const [xMax, yMax, zMax] = max
  const [xMinCube, yMinCube, zMinCube, xMaxCube, yMaxCube, zMaxCube] = cube
  const badPoints = getBadPoints(
    pointData,
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
  return badPoints.length > 0
    ? Statuses.failureWithInfo(`X, Y, or Z out of bounds: [ ${badPoints} ]`)
    : Statuses.success
}

type gpsTimeRange = [number, number]
const checkGpsTime = <T extends object = any>(
  pointData: enhancedWithRootPoint<T>,
  [min, max]: gpsTimeRange,
): Check.Status => {
  const badPoints = getBadPoints(
    pointData,
    (d) =>
      typeof d.GpsTime === 'undefined' || d.GpsTime < min || d.GpsTime > max,
  )
  return badPoints.length > 0
    ? Statuses.failureWithInfo(`GpsTime out of bounds: [ ${badPoints} ]`)
    : Statuses.success
}

// ===== UTILS =====
/**
 * Function to check the output of `reduceDimensions()` for points that go against
 * the COPC spec. A `true` returned by this function is considered a Point Data
 * Record that violates the COPC specification.
 */
export type pointChecker = (data: Record<string, number | undefined>) => boolean
/**
 * Utility function to iterate over enhanced point data and find
 * points violating the COPC specificiations.
 *
 * @param pd Form: ```{
 *   'D-X-Y-Z': {
 *     root: {
 *       [dimension: string]: number
 *     }
 *   }
 * }```
 * @param {pointChecker} check Function to check the dimensions of enhanced point data
 * for points that go against the COPC spec. A `true` returned by this function is
 * considered a Point Data Record that violates the COPC specification.
 * @returns {string[]} Array of nodes that return `true` given the `check` function
 */
export const getBadPoints = <T extends object = any>(
  pd: enhancedWithRootPoint<T>, //reducedPointData,
  check: pointChecker,
): string[] =>
  Object.entries(pd).reduce<string[]>((prev, curr) => {
    const [node, { root }] = curr
    try {
      // try {} wrapper in case check() fails. Considered a point failure
      if (check(root)) return [...prev, node]
    } catch (e) {
      return [...prev, node]
    }
    return [...prev]
  }, [])

export const getReducedBadPoints = (
  pd: reducedPointData,
  check: pointChecker,
): string[] =>
  Object.entries(pd).reduce<string[]>((prev, curr) => {
    const [node, data] = curr
    try {
      // try {} wrapper in case check() fails. Considered a point failure
      if (check(data)) return [...prev, node]
    } catch (e) {
      return [...prev, node]
    }
    return [...prev]
  }, [])

export type reducedPointData = Record<
  string,
  Record<string, number | undefined>
>
/**
 * Utility function to trim dimensions from an enhanced hierarchy page node
 * @param points Hierarchy.Node.Map (or similar object) enhanced with Root Point data,
 * meaning it contains the object `root: {[dimension]: number}`
 * @param dimensions Array of dimension names to keep in the `points` object
 * @returns copy of `points`, without Hierarchy data, with `root`'s properties
 * matching the `dimensions` array flattened onto the top level
 */
export const reduceDimensions = <T extends object = any>(
  points: enhancedWithRootPoint<T>,
  dimensions: readonly string[],
): Record<string, Record<typeof dimensions[number], number>> =>
  reduce(
    points,
    (prev, curr, path) => ({
      ...prev,
      [path]: Object.fromEntries(
        dimensions
          .map<[string, number]>((d) => [d, curr.root[d]])
          .filter(([_dim, value]) => value !== undefined),
      ),
    }),
    {},
  )
