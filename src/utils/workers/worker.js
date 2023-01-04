import { expose } from 'threads/worker'
import { LazPerf } from 'laz-perf/lib/worker/index.js'
import { Getter, Copc, Bounds, Key } from 'copc'
const { stepTo } = Bounds
const { parse } = Key
const { loadPointDataView } = Copc

const boolToStatus = (b, warning = false) =>
  !b ? 'pass' : warning ? 'warn' : 'fail'

let lazPerfPromise

expose(async function ({ file, copc, key, node, deep, lazPerfWasmFilename }) {
  // console.log(`Reading ${key}`)
  // console.time(key)

  if (lazPerfWasmFilename) {
    if (!lazPerfPromise)
      // console.log('(WORKER) Locating laz-perf:', lazPerfWasmFilename)
      lazPerfPromise = LazPerf.create({
        locateFile: () => lazPerfWasmFilename,
        INITIAL_MEMORY: 262144,
        TOTAL_STACK: 65536,
        FAST_MEMORY: 65536,
      })
  } else {
    lazPerfPromise = undefined // let Copc create its own lazPerf
    // had issues finding the laz-perf.wasm file in NodeJS, so for now I'm ignoring it
  }
  let prevGpsTime = 0
  if (node.pointCount === 0) {
    const checks = {
      ...node,
      rgb: 'pass',
      rgbi: 'pass',
      xyz: 'pass',
      gpsTime: 'pass',
      sortedGpsTime: 'pass',
      returnNumber: 'pass',
      zeroPoints: 'warn',
    }
    return [key, checks]
  }
  const get =
    typeof file === 'string'
      ? Getter.create(file)
      : async (b, e) => new Uint8Array(await file.slice(b, e).arrayBuffer())
  const view = await loadPointDataView(get, copc, node, {
    lazPerf: await lazPerfPromise,
  }) //Copc.
  const dimensions = Object.keys(view.dimensions)
  const getters = dimensions.reduce((acc, dimension) => {
    acc[dimension] = view.getter(dimension)
    return acc
  }, {})
  /**
   * Function mapping an index to an object of dimensions
   * @param {number} idx Point index (within Node) to get dimensions
   * @returns {Record<string, number>} Object matching type `{ [dimension]: number }`
   */
  const getDimensions = (idx) =>
    dimensions.reduce((acc, dimension) => {
      acc[dimension] = getters[dimension](idx)
      return acc
    }, {})

  const {
    info: {
      cube,
      gpsTimeRange: [min, max],
    },
  } = copc
  const hasRgb = copc.header.pointDataRecordFormat !== 6
  const [minx, miny, minz, maxx, maxy, maxz] = stepTo(
    //Bounds.
    cube,
    parse(key), //Key.
  )

  const length = deep ? view.pointCount : 1

  let checks = node
  //using for loop over Array.reduce so we can early exit if all checks are fails
  for (let i = 0; i < length; i++) {
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
      checks.sortedGpsTime = boolToStatus(point.gpsTime < prevGpsTime)
      prevGpsTime = point.gpsTime
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

  // console.timeEnd(key)
  // console.log(checks)
  return [key, checks]
})
