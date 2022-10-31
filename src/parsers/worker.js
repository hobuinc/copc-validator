const { Getter, Copc, Bounds, Key } = require('copc')

module.exports = async ({ filepath, key, node, deep }) => {
  if (node.pointCount === 0) {
    // const checks = Object.keys(microPointDataSuite).reduce(
    //   (prev, id) => ({ ...prev, [id]: 'pass' }),
    //   {},
    // )
    // DOESN'T LIKE Object.keys.reduce FOR SOME REASON???
    const checks = {
      ...node,
      rgb: 'pass',
      rgbi: 'pass',
      xyz: 'pass',
      gpsTime: 'pass',
      sortedGpsTime: 'pass',
      returnNumber: 'pass',
    }
    return [key, checks]
  }
  const get = Getter.create(filepath)
  const copc = await Copc.create(get)
  const view = await Copc.loadPointDataView(get, copc, node)
  const dimensions = Object.keys(view.dimensions)
  const getDimensions = (idx) =>
    dimensions
      .map(view.getter)
      .reduce((prev, curr, i) => ({ ...prev, [dimensions[i]]: curr(idx) }), {})

  const data = deep
    ? Array.from(new Array(view.pointCount), (_v, i) => getDimensions(i))
    : getDimensions(0)
  const source = { copc, key, data }
  const checks = Object.fromEntries(
    Object.entries(microPointDataSuite).map(([id, f]) => [id, f(source)]),
  )
  return [key, { ...node, ...checks }]
}

const microPointDataSuite = {
  rgb: ({ copc: { header }, data }) =>
    checkRgb(data, header.pointDataRecordFormat),
  rgbi: ({ copc: { header }, data }) =>
    checkRgbi(data, header.pointDataRecordFormat),
  xyz: ({
    copc: {
      info: { cube },
    },
    data,
    key,
  }) => checkBounds(data, cube, key),
  gpsTime: ({
    copc: {
      info: { gpsTimeRange },
    },
    data,
  }) => checkGpsTime(data, gpsTimeRange),
  sortedGpsTime: ({ data }) => checkGpsTimeSorted(data),
  returnNumber: ({ data }) => checkReturnNumber(data),
}

const checkRgb = (data, pdrf) => {
  if (pdrf === 6)
    return checkNode(
      data,
      (d) =>
        typeof d.Red !== 'undefined' ||
        typeof d.Green !== 'undefined' ||
        typeof d.Blue !== 'undefined',
    )
  return checkNode(
    data,
    (d) =>
      typeof d.Red === 'undefined' ||
      typeof d.Green === 'undefined' ||
      typeof d.Blue === 'undefined' ||
      (d.Red === 0 && d.Green === 0 && d.Blue === 0),
  )
}

const checkRgbi = (data, pdrf) => {
  const hasRgb = pdrf !== 6
  if (hasRgb) {
    if (
      isBadNode(
        data,
        (d) =>
          typeof d.Red === 'undefined' ||
          typeof d.Green === 'undefined' ||
          typeof d.Blue === 'undefined',
      )
    )
      return 'fail'
  }
  return checkNode(
    data,
    hasRgb
      ? (d) =>
          d.Red <= 255 && d.Green <= 255 && d.Blue <= 255 && d.Intensity <= 255
      : (d) => d.Intensity <= 255,
    true,
    true,
  )
}

const checkBounds = (data, bounds, key) => {
  const [minx, miny, minz, maxx, maxy, maxz] = Bounds.stepTo(
    bounds,
    Key.parse(key),
  )
  return checkNode(
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
  )
}

// type gpsTimeRange = [number, number]
const checkGpsTime = (data, [min, max]) => {
  return checkNode(
    data,
    (d) =>
      typeof d.GpsTime === 'undefined' || d.GpsTime < min || d.GpsTime > max,
  )
}

const checkGpsTimeSorted = (data) => {
  if (!Array.isArray(data)) return 'pass' // cannot check if a single point is sorted
  let prevGpsTime = 0
  return checkNode(
    data,
    (d) => {
      const isBad = d.GpsTime < prevGpsTime
      prevGpsTime = d.GpsTime
      return isBad
    },
    true,
  )
}

const checkReturnNumber = (data) => {
  return checkNode(
    data,
    (d) =>
      typeof d.ReturnNumber === 'undefined' ||
      typeof d.NumberOfReturns === 'undefined' ||
      d.ReturnNumber > d.NumberOfReturns,
  )
}

const checkNode = (data, check, warning = false, every = false) =>
  boolToStatus(!isBadNode(data, check, every), warning)

/**
 *
 * @param data
 * @param check
 * @param every
 * @returns `true` if Node violates the specs, `false` if Node checks out OK
 */
const isBadNode = (data, check, every = false) =>
  Array.isArray(data)
    ? every
      ? data.every((d) => check(d))
      : data.some((d) => check(d))
    : check(data)

const boolToStatus = (b, warning = false) =>
  b ? 'pass' : warning ? 'warn' : 'fail'
