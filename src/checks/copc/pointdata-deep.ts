import { invokeAllChecks, Statuses } from 'checks'
import { Copc, Getter, Hierarchy, Point } from 'copc'
import { Check } from 'types'
import {
  copcWithGetter,
  // enhancedHierarchyNodes,
  // enhancedWithRootPoint,
  // getNodePoints,
  // NodePoints,
} from './common'
import { isEqual, map, reduce } from 'lodash'

export const deepNodeScan: Check.Suite<copcWithGetter> = {
  readAllPoints: async ({ get, copc }) => {
    try {
      const { nodes } = await Copc.loadHierarchyPage(
        get,
        copc.info.rootHierarchyPage,
      )
      // TODO: Handle more than one page
      // this works fine, in like 1.5 seconds for ellipsoid.copc.laz
      const points = await getNodePoints(get, copc, nodes)
      const pd = fullHierarchyNodes(nodes, points)
      console.dir(pd, { depth: null })
      return invokeAllChecks({
        source: { copc, nodes, points },
        suite: pointData,
      })
    } catch (error) {
      return [
        {
          id: 'deep-nodeScan.NS',
          status: 'fail',
          info: (error as Error).message,
        },
      ]
    }
  },
}

export default deepNodeScan

// using `nodes` and `points` instead of fullHierarchyNodes should be much more performant
// nevermind, I fixed fullHierarchyNodes, onto fixing these suites...
export const pointData: Check.Suite<{
  copc: Copc
  nodes: Hierarchy.Node.Map
  points: NodePoints[]
}> = {
  gpsTime: ({
    copc: {
      info: { gpsTimeRange },
    },
    points,
  }) => checkGpsTime(points, gpsTimeRange),
}

// ========== POINT DATA CHECKS ==========
type gpsTimeRange = [number, number]
const checkGpsTime = (
  // nodes: Hierarchy.Node.Map,
  points: NodePoints[],
  [min, max]: gpsTimeRange,
): Check.Status => {
  const badNodes = getBadNodes(points, (points) =>
    points.some(
      (p) =>
        typeof p.GpsTime === 'undefined' || p.GpsTime < min || p.GpsTime > max,
    ),
  )
  return badNodes.length > 0
    ? Statuses.failureWithInfo(`GpsTime out of bounds: [ ${badNodes} ]`)
    : Statuses.success
}

// ========== UTILITIES ==========
type pointsChecker = (points: Record<string, number>[]) => boolean
export const getBadNodes = (
  points: NodePoints[],
  check: pointsChecker,
): string[] =>
  points.reduce<string[]>((prev, { key, points }) => {
    try {
      if (check(points)) return [...prev, key]
    } catch (error) {
      return [...prev, key]
    }
    return [...prev]
  }, [])

export type NodePoints = {
  key: string
  /** Array of PointData:
   * array index = point index in node
   * Object: `{ [dimension: string]: number }`
   */
  points: Record<string, number>[]
}
export const getNodePoints = async (
  get: Getter,
  copc: Copc,
  nodes: Hierarchy.Node.Map,
): Promise<NodePoints[]> =>
  await Promise.all(
    map(nodes, async (node, key) => {
      const view = await Copc.loadPointDataView(get, copc, node!)

      const dimensions = Object.keys(view.dimensions)
      const getters = dimensions.map(view.getter)
      const getDimensions = (index: number): Record<string, number> =>
        getters.reduce(
          (prev, curr, i) => ({ ...prev, [dimensions[i]]: curr(index) }),
          {},
        )
      const points = Array.from(new Array(view.pointCount), (_v, index) =>
        getDimensions(index),
      )
      return { key, points }
    }),
  )

export type deepHierarchy = Record<
  string,
  Hierarchy.Node & { points: Record<string, number>[] }
>
export const fullHierarchyNodes = (
  nodes: Hierarchy.Node.Map,
  points: NodePoints[],
): deepHierarchy =>
  points.reduce<deepHierarchy>(
    (prev, { key, points }) => ({
      ...prev,
      [key]: { ...(nodes[key] as Hierarchy.Node), points },
    }),
    {},
  )
// I believe this version is sufficiently performant
