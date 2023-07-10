import { expose } from 'threads/worker'
import { LazPerf } from 'laz-perf/lib/worker/index.js'
import { Getter, Copc, Bounds, Key, Las, Binary, Hierarchy } from 'copc'

// ========== UTILITIES ==========
const boolToStatus = (b, warning = false) =>
  !b ? 'pass' : warning ? 'warn' : 'fail'

const shallowGetDimensions = async ({ get, copc, node }) => {
  const extractors = Las.Extractor.create(copc.header, copc.eb)
  const dimensions = Object.keys(Las.Dimensions.create(extractors, copc.eb))
  const dv = Binary.toDataView(
    await get(
      node.pointDataOffset,
      node.pointDataOffset + node.pointDataLength,
    ),
  )
  function getter(name) {
    const extractor = extractors[name]
    if (!extractor) throw new Error(`No extractor for dimension: ${name}`)
    return function (index) {
      if (index >= node.pointCount) {
        throw new RangeError(
          `View index (${index}) out of range: ${node.pointCount}`,
        )
      }
      return extractor(dv, index)
    }
  }
  const getDimensions = (idx) =>
    dimensions.reduce((acc, dimension) => {
      acc[dimension] = getter(dimension)(idx)
      return acc
    }, {})
  return getDimensions
}

const deepGetDimensions = async ({ get, copc, node, lazPerf }) => {
  const view = await Copc.loadPointDataView(get, copc, node, {
    lazPerf: await lazPerf,
  })
  const dimensions = Object.keys(view.dimensions)

  const getDimensions = (idx) =>
    dimensions.reduce((acc, dimension) => {
      acc[dimension] = view.getter(dimension)(idx)
      return acc
    }, {})
  return getDimensions
}

let lazPerfPromise

// ========== EXPOSED MODULE ==========
const exposed = {
  /**
   * Shallow scan function that reads the first point of the given node
   * (without decompressing the node, meaning no lazPerfWasmFilename)
   * and performs a suite of check functions on that point
   * @param {{file: File | string, copc: Copc, key: string, node: Hierarchy.Node}} param0
   * @returns [key, {...node, [id: string]: 'pass' | 'fail' | 'warn'}]
   */
  async shallow({ file, copc, key, node }) {
    let prevGpsTime = 0

    const get =
      typeof file === 'string'
        ? Getter.create(file)
        : async (b, e) => new Uint8Array(await file.slice(b, e).arrayBuffer())

    const getDimensions = await shallowGetDimensions({
      get,
      copc,
      node,
    })

    const {
      info: {
        cube,
        gpsTimeRange: [min, max],
      },
    } = copc
    const hasRgb = copc.header.pointDataRecordFormat !== 6
    const [minx, miny, minz, maxx, maxy, maxz] = Bounds.stepTo(
      cube,
      Key.parse(key),
    )

    let checks = node

    const point = getDimensions(0)

    checks.rgb = !hasRgb
      ? boolToStatus(
          typeof point.Red !== 'undefined' ||
            typeof point.Green !== 'undefined' ||
            typeof point.Blue !== 'undefined',
        )
      : boolToStatus(
          typeof point.Red === 'undefined' ||
            typeof point.Green === 'undefined' ||
            typeof point.Blue === 'undefined' ||
            (point.Red === 0 && point.Green === 0 && point.Blue === 0),
          true,
        )

    if (
      hasRgb &&
      (typeof point.Red === 'undefined' ||
        typeof point.Green === 'undefined' ||
        typeof point.Blue === 'undefined')
    ) {
      checks.rgbi = 'fail'
    } else {
      checks.rgbi = boolToStatus(
        hasRgb
          ? point.Red <= 255 &&
              point.Green <= 255 &&
              point.Blue <= 255 &&
              point.Intensity <= 255
          : point.Intensity <= 255,
        true,
      )
    } //this, with `rgbi === warn`, is the equivalent of checking that every
    //  point is bad, otherwise the node tests OK

    checks.xyz = boolToStatus(
      typeof point.X === 'undefined' ||
        typeof point.Y === 'undefined' ||
        typeof point.Z === 'undefined' ||
        point.X < minx ||
        point.X > maxx ||
        point.Y < miny ||
        point.Y > maxy ||
        point.Z < minz ||
        point.Z > maxz,
    )

    checks.gpsTime = boolToStatus(
      typeof point.GpsTime === 'undefined' ||
        point.GpsTime < min ||
        point.GpsTime > max,
    )

    checks.sortedGpsTime = boolToStatus(point.gpsTime < prevGpsTime)
    prevGpsTime = point.gpsTime

    checks.returnNumber = boolToStatus(
      typeof point.ReturnNumber === 'undefined' ||
        typeof point.NumberOfReturns === 'undefined' ||
        point.ReturnNumber > point.NumberOfReturns,
    )

    return [key, checks]
  },

  /**
   * Deep scan function that reads every point of the given node and
   * runs the same Shallow check suite across all points
   * @param {*} param0
   * @returns [key, {...node, [id: string]: 'pass' | 'fail' | 'warn'}]
   */
  async deep({ file, copc, key, node, lazPerfWasmFilename }) {
    if (lazPerfWasmFilename) {
      if (!lazPerfPromise)
        lazPerfPromise = LazPerf.create({
          locateFile: () => lazPerfWasmFilename,
          INITIAL_MEMORY: 262144,
          TOTAL_STACK: 65536,
          FAST_MEMORY: 65536,
        })
    } else {
      lazPerfPromise = undefined
    }

    let prevGpsTime = 0

    const get =
      typeof file === 'string'
        ? Getter.create(file)
        : async (b, e) => new Uint8Array(await file.slice(b, e).arrayBuffer())

    const getDimensions = await deepGetDimensions({
      get,
      copc,
      node,
      lazPerf: lazPerfPromise,
    })

    const {
      info: {
        cube,
        gpsTimeRange: [min, max],
      },
    } = copc
    const hasRgb = copc.header.pointDataRecordFormat !== 6
    const [minx, miny, minz, maxx, maxy, maxz] = Bounds.stepTo(
      cube,
      Key.parse(key),
    )

    let checks = node
    //using for loop over Array.reduce so we can early exit if all checks are fails
    for (let i = 0; i < node.pointCount; i++) {
      const { rgb, rgbi, xyz, gpsTime, sortedGpsTime, returnNumber } = checks
      let earlyBreak = true
      const point = getDimensions(i)

      if (typeof rgb === 'undefined' || rgb === 'pass') {
        earlyBreak = false
        checks.rgb = !hasRgb
          ? boolToStatus(
              typeof point.Red !== 'undefined' ||
                typeof point.Green !== 'undefined' ||
                typeof point.Blue !== 'undefined',
            )
          : boolToStatus(
              typeof point.Red === 'undefined' ||
                typeof point.Green === 'undefined' ||
                typeof point.Blue === 'undefined' ||
                (point.Red === 0 && point.Green === 0 && point.Blue === 0),
              true,
            )
      }
      if (typeof rgbi === 'undefined' || rgbi === 'warn') {
        earlyBreak = false
        if (
          hasRgb &&
          (typeof point.Red === 'undefined' ||
            typeof point.Green === 'undefined' ||
            typeof point.Blue === 'undefined')
        ) {
          checks.rgbi = 'fail'
        } else {
          checks.rgbi = boolToStatus(
            hasRgb
              ? point.Red <= 255 &&
                  point.Green <= 255 &&
                  point.Blue <= 255 &&
                  point.Intensity <= 255
              : point.Intensity <= 255,
            true,
          )
        } //this, with `rgbi === warn`, is the equivalent of checking that every
        //  point is bad, otherwise the node tests OK
      }
      if (typeof xyz === 'undefined' || xyz === 'pass') {
        earlyBreak = false
        checks.xyz = boolToStatus(
          typeof point.X === 'undefined' ||
            typeof point.Y === 'undefined' ||
            typeof point.Z === 'undefined' ||
            point.X < minx ||
            point.X > maxx ||
            point.Y < miny ||
            point.Y > maxy ||
            point.Z < minz ||
            point.Z > maxz,
        )
      }
      if (typeof gpsTime === 'undefined' || gpsTime === 'pass') {
        earlyBreak = false
        checks.gpsTime = boolToStatus(
          typeof point.GpsTime === 'undefined' ||
            point.GpsTime < min ||
            point.GpsTime > max,
        )
      }
      if (typeof sortedGpsTime === 'undefined' || sortedGpsTime === 'pass') {
        earlyBreak = false
        checks.sortedGpsTime = boolToStatus(point.GpsTime < prevGpsTime, true)
        prevGpsTime = point.GpsTime
      }
      if (typeof returnNumber === 'undefined' || returnNumber === 'pass') {
        earlyBreak = false
        checks.returnNumber = boolToStatus(
          typeof point.ReturnNumber === 'undefined' ||
            typeof point.NumberOfReturns === 'undefined' ||
            point.ReturnNumber > point.NumberOfReturns,
        )
      }
      if (earlyBreak) break
    }

    return [key, checks]
  },
}

expose(exposed)
