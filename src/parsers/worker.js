const { Getter, Copc, Bounds, Key } = require('copc')
/**
 * Checks Node Data for ANY point within the Node considered 'bad', according to
 * the specification check.
 * @param {Record<string, number>[]} array Data from using getDimensions
 * @param {(p: Record<string, number>) => boolean} itemCheck returns `true` if
 * point violates the specification
 * @returns {boolean} `true` if ANY point violates the specifications
 */
const arrayAny = (array, itemCheck) => {
  for (const point of array) {
    if (itemCheck(point)) return true
  }
  return false
}

/**
 * Checks Node Data to see if ALL points within the Node are 'bad', according to
 * the specification check.
 * @param {Record<string, number>[]} array Data from using getDimensions
 * @param {(p: Record<string, number>) => boolean} itemCheck returns `true` if
 * point violates the specification
 * @returns {boolean} `true` if ALL points violate the specifications
 */
const arrayEvery = (array, itemCheck) => {
  for (const point of array) {
    if (!itemCheck(point)) return false
  }
  return true
}

// Converts arrayAny & arrayEvery into status strings
const boolToStatus = (b, warning = false) =>
  !b ? 'pass' : warning ? 'warn' : 'fail'

const pointDataSuite = {
  rgb: ({ copc: { header }, data }) => {
    if (header.pointDataRecordFormat === 6)
      return boolToStatus(
        arrayAny(
          data,
          (d) =>
            typeof d.Red !== 'undefined' ||
            typeof d.Green !== 'undefined' ||
            typeof d.Blue !== 'undefined',
        ),
      ) // return 'fail' if RGB data is defined, but shouldn't be
    return boolToStatus(
      arrayAny(
        data,
        (d) =>
          typeof d.Red === 'undefined' ||
          typeof d.Green === 'undefined' ||
          typeof d.Blue === 'undefined' ||
          (d.Red === 0 && d.Green === 0 && d.Blue === 0),
      ),
      true,
    ) // return 'warn' if RGB data should be defined, but any point is undefined or un-utilized
  },
  rgbi: ({ copc: { header }, data }) => {
    const hasRgb = header.pointDataRecordFormat !== 6
    if (hasRgb)
      if (
        arrayAny(
          data,
          (d) =>
            typeof d.Red === 'undefined' ||
            typeof d.Green === 'undefined' ||
            typeof d.Blue === 'undefined',
        )
      )
        return 'fail'

    return boolToStatus(
      arrayEvery(
        data,
        hasRgb
          ? (d) =>
              d.Red <= 255 &&
              d.Green <= 255 &&
              d.Blue <= 255 &&
              d.Intensity <= 255
          : (d) => d.Intensity <= 255,
      ),
      true,
    )
  },
  xyz: ({
    copc: {
      info: { cube },
    },
    data,
    key,
  }) => {
    const [minx, miny, minz, maxx, maxy, maxz] = Bounds.stepTo(
      cube,
      Key.parse(key),
    )
    return boolToStatus(
      arrayAny(
        data,
        (d) =>
          typeof d.X === 'undefined' ||
          typeof d.Y === 'undefined' ||
          typeof d.Z === 'undefined' ||
          d.X < minx ||
          d.X > maxx ||
          d.Y < miny ||
          d.Y > maxy ||
          d.Z < minz ||
          d.Z > maxz,
      ),
    )
  },
  gpsTime: ({
    copc: {
      info: {
        gpsTimeRange: [min, max],
      },
    },
    data,
  }) =>
    boolToStatus(
      arrayAny(
        data,
        (d) =>
          typeof d.GpsTime === 'undefined' ||
          d.GpsTime < min ||
          d.GpsTime > max,
      ),
    ),
  sortedGpsTime: ({ data }) => {
    let prevGpsTime = 0
    return boolToStatus(
      arrayAny(data, (d) => {
        const isBad = d.GpsTime < prevGpsTime
        prevGpsTime = d.GpsTime
        return isBad
      }),
      true,
    )
  },
  returnNumber: ({ data }) =>
    boolToStatus(
      arrayAny(
        data,
        (d) =>
          typeof d.ReturnNumber === 'undefined' ||
          typeof d.NumberOfReturns === 'undefined' ||
          d.ReturnNumber > d.NumberOfReturns,
      ),
    ),
}

module.exports = async ({ filepath, copc, key, node, deep }) => {
  // console.time(`${key} ${node.pointCount}`)
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
    // console.timeEnd(`${key} ${node.pointCount}`)
    return [key, checks]
  }
  const get = Getter.create(filepath)
  // const copc = await Copc.create(get)
  // slightly faster to re-copy Copc object already passed to nodeParser
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
      //               object lookup is linear
      acc[dimension] = getters[dimension](idx)
      return acc
    }, {})

  const length = deep ? view.pointCount : 1
  const data = Array.from({ length }, (_v, i) => getDimensions(i))
  // using arrayAny & arrayEvery is faster than checking each point as it's read
  const checks = Object.entries(pointDataSuite).reduce((acc, [id, f]) => {
    acc[id] = f({ copc, key, data })
    return acc
  }, node) // start with node object to build off pointCount & pointData info
  // faster than {...x, ...y} which becomes Object.assign(Object.assign({}, x), y)

  // console.timeEnd(`${key} ${node.pointCount}`)
  return [key, checks]
}
