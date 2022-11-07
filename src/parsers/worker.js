const { Getter, Copc, Bounds, Key } = require('copc')

const boolToStatus = (b, warning = false) =>
  !b ? 'pass' : warning ? 'warn' : 'fail'

let prevGpsTime = 0

module.exports = async ({ filepath, copc, key, node, deep }) => {
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
  const get = Getter.create(filepath)
  const view = await Copc.loadPointDataView(get, copc, node)
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
  const [minx, miny, minz, maxx, maxy, maxz] = Bounds.stepTo(
    cube,
    Key.parse(key),
  )

  const length = deep ? view.pointCount : 1

  let checks = node
  //using for loop over Array.reduce so we can early exit if all checks are fails
  for (let i = 0; i < length; i++) {
    const { rgb, rgbi, xyz, gpsTime, sortedGpsTime, returnNumber } = checks
    if (
      (rgb === 'fail' || rgb === 'warn') &&
      (rgbi === 'fail' || rgbi === 'pass') &&
      xyz === 'fail' &&
      gpsTime === 'fail' &&
      sortedGpsTime === 'fail' &&
      returnNumber === 'fail'
    ) {
      break
      //early stop, no need to read any more points
    }
    const point = getDimensions(i)
    if (typeof rgb === 'undefined' || rgb === 'pass') {
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
      if (
        hasRgb &&
        (typeof point.Red === 'undefined' ||
          typeof point.Green === 'undefined' ||
          typeof point.Blue === 'undefined')
      )
        checks.rgbi = 'fail'
      else {
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
      checks.gpsTime = boolToStatus(
        typeof point.GpsTime === 'undefined' ||
          point.GpsTime < min ||
          point.GpsTime > max,
      )
    }
    if (typeof sortedGpsTime === 'undefined' || sortedGpsTime === 'pass') {
      checks.sortedGpsTime = boolToStatus(point.gpsTime < prevGpsTime)
      prevGpsTime = point.gpsTime
    }
    if (typeof returnNumber === 'undefined' || returnNumber === 'pass') {
      checks.returnNumber = boolToStatus(
        typeof point.ReturnNumber === 'undefined' ||
          typeof point.NumberOfReturns === 'undefined' ||
          point.ReturnNumber > point.NumberOfReturns,
      )
    }
  }

  return checks
}
