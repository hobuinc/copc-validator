// const { Getter, Copc, Bounds, Key } = require('copc')
// const { expose } = require('threads/worker')
import { expose } from 'threads/worker'
import { Getter, Copc, Bounds, Key } from 'copc'
const { stepTo } = Bounds
const { parse } = Key
const { create } = Getter
const { loadPointDataView } = Copc

const boolToStatus = (b, warning = false) =>
  !b ? 'pass' : warning ? 'warn' : 'fail'

expose(async function ({ filepath, copc, key, node, deep }) {
  // console.log(`Reading ${key}`)
  // console.time(key)
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
  const get = create(filepath) //Getter.
  const view = await loadPointDataView(get, copc, node) //Copc.
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
  const hasRgb = copc.header.pointDataRecordFormat !== 6 //pointDataRecordFormat !== 6
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
    // if (
    //   (rgb === 'fail' || rgb === 'warn') &&
    //   (rgbi === 'fail' || rgbi === 'pass') &&
    //   xyz === 'fail' &&
    //   gpsTime === 'fail' &&
    //   sortedGpsTime === 'fail' &&
    //   returnNumber === 'fail'
    // ) {
    //   break
    //   //early stop, no need to read any more points
    // }
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
    } else {
      earlyBreak &&= true
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
    } else {
      earlyBreak &&= true
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
    } else {
      earlyBreak &&= true
    }
    if (typeof gpsTime === 'undefined' || gpsTime === 'pass') {
      earlyBreak = false
      checks.gpsTime = boolToStatus(
        typeof point.GpsTime === 'undefined' ||
          point.GpsTime < min ||
          point.GpsTime > max,
      )
    } else {
      earlyBreak &&= true
    }
    if (typeof sortedGpsTime === 'undefined' || sortedGpsTime === 'pass') {
      earlyBreak = false
      checks.sortedGpsTime = boolToStatus(point.gpsTime < prevGpsTime)
      prevGpsTime = point.gpsTime
    } else {
      earlyBreak &&= true
    }
    if (typeof returnNumber === 'undefined' || returnNumber === 'pass') {
      earlyBreak = false
      checks.returnNumber = boolToStatus(
        typeof point.ReturnNumber === 'undefined' ||
          typeof point.NumberOfReturns === 'undefined' ||
          point.ReturnNumber > point.NumberOfReturns,
      )
    } else {
      earlyBreak &&= true
    }
  }

  // console.timeEnd(key)
  // console.log(checks)
  return [key, checks]
})
