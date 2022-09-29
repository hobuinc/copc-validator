import { Point } from 'copc'
import { isEqual, reduce } from 'lodash'
import { Check } from 'types'
import {
  enhancedWithPointData,
  EnhanchedHierarchyParams,
  Messages,
} from './common'

export const pointData: Check.Suite<EnhanchedHierarchyParams> = {
  rgb: ({ copc, pd }) =>
    checkRgb(pd, copc.header.pointDataRecordFormat as 6 | 7 | 8),
  rgbi: ({ pd }) => checkRgbi(pd),
  xyz: ({ copc, pd }) => checkXyz(pd, copc.header.min, copc.header.max),
  returns: ({ copc, pd }) => {
    const pointData = reduceDimensions(pd, ['ReturnNumber', 'NumberOfReturns'])
    const badPoints = getBadPoints(
      pointData,
      (d) => d.ReturnNumber! > d.NumberOfReturns!,
    )
    return badPoints.length > 0
      ? Messages.failureWithInfo(badPoints)
      : Messages.success
  },
}

// ===== CHECKS =====
const checkRgb = <T extends object = any>(
  points: enhancedWithPointData<T>,
  pdrf: 6 | 7 | 8,
): Check.Status => {
  const pointData = reduceDimensions(points, ['Red', 'Green', 'Blue'])
  if (pdrf === 6) {
    const badRootPoints = getBadPoints(
      pointData,
      (d) => !isEqual(d, { Red: undefined, Green: undefined, Blue: undefined }),
    )
    return badRootPoints.length > 0
      ? Messages.failureWithInfo(
          `(PDRF: 6) RGB data found at: ${badRootPoints.toLocaleString()}`,
        )
      : { status: 'pass' }
  }
  // else
  const badRootPoints = getBadPoints(
    pointData,
    (d) =>
      isEqual(d, { Red: undefined, Green: undefined, Blue: undefined }) ||
      isEqual(d, { Red: 0, Green: 0, Blue: 0 }),
  )
  return badRootPoints.length > 0
    ? {
        status: 'warn',
        info: `(PDRF: ${pdrf}) Unutilized RGB data found at: ${badRootPoints.toLocaleString()}`,
      }
    : { status: 'pass' }
}

const checkRgbi = <T extends object = any>(
  points: enhancedWithPointData<T>,
): Check.Status => {
  const pointData = reduceDimensions(points, [
    'Red',
    'Green',
    'Blue',
    'Intensity',
  ])
  const badPoints = getBadPoints(
    pointData,
    (d) =>
      d.Red! <= 255 && d.Green! <= 255 && d.Blue! <= 255 && d.Intensity! <= 255,
  )
  return badPoints.length === Object.entries(pointData).length
    ? Messages.warningWithInfo(
        'Points appear to contain 8-bit color. Should be scaled to 16-bit.',
      )
    : Messages.success
}

/**
 *
 * @param points
 * @param min
 * @param max
 */
const checkXyz = <T extends object = any>(
  points: enhancedWithPointData<T>,
  min: Point,
  max: Point,
): Check.Status => {
  const pointData = reduceDimensions(points, ['X', 'Y', 'Z'])
  const [xMin, yMin, zMin] = min
  const [xMax, yMax, zMax] = max
  const badPoints = getBadPoints(
    pointData,
    (d) =>
      d.X! < xMin ||
      d.X! > xMax ||
      d.Y! < yMin ||
      d.Y! > yMax ||
      d.Z! < zMin ||
      d.Z! > zMax,
  )
  return badPoints.length > 0
    ? Messages.failureWithInfo(
        `X, Y, or Z out of bounds: ${badPoints.toLocaleString()}`,
      )
    : Messages.success
}

// ===== UTILS =====
type reducedPointData = Record<string, Record<string, number | undefined>>
const reduceDimensions = <T extends object = any>(
  points: enhancedWithPointData<T>,
  dimensions: readonly string[],
): Record<string, Record<typeof dimensions[number], number | undefined>> =>
  reduce(
    points,
    (prev, curr, path) => ({
      ...prev,
      [path]: Object.fromEntries(dimensions.map((d) => [d, curr.root[d]])),
    }),
    {},
  )

/**
 * Function to check the output of `reduceDimensions()` for points that go against
 * the COPC spec. A `true` returned by this function is considered a Point Data
 * Record that violates the COPC specification.
 */
type pointChecker = (data: Record<string, number | undefined>) => boolean
/**
 * Utility function to iterate over the output of `reduceDimensions()` and find
 * points violating the COPC specificiations.
 *
 * @param pd Form: ```{
 *   'D-X-Y-Z': {
 *     root: {
 *       [dimension: string]: number
 *     }
 *   }
 * }```
 * @param {pointChecker} check Function to check the output of `reduceDimensions()`
 * for points that go against the COPC spec. A `true` returned by this function is
 * considered a Point Data Record that violates the COPC specification.
 * @returns {string[]} Array of nodes that return `true` given the `check` function
 */
const getBadPoints = (pd: reducedPointData, check: pointChecker): string[] =>
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
