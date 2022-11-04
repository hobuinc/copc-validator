const { Getter, Copc, Bounds, Key } = require('copc')

// /**
//  *
//  * @param {Record<string, number>} point
//  * @param {(point: Record<string, number>) => boolean} check
//  * @param {boolean} warning
//  * @returns
//  */
// const checkPoint = (point, check, warning = false) =>
//   boolToStatus(!check(point), warning)

// if any point returns 'true', node violates (returns true)
const arrayAny = (array, itemCheck) => {
  for (const point of array) {
    if (itemCheck(point)) return true
  }
  return false
}
// aka if all points return 'false', node is OK

// if all points return 'true', node violates (returns true)
const arrayEvery = (array, itemCheck) => {
  for (const point of array) {
    if (!itemCheck(point)) return false
  }
  return true
}
// aka if any point returns 'false', node is OK

// every point must return 'true', otherwise node violates
// const newEvery = (array, itemCheck) => {
//   // let result = true
//   for (const point of array) {
//     // result = result && itemCheck(point)
//     if (!itemCheck(point)) return false
//   }
//   return true
// }

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
        // data.some(
        //   (d) =>
        //     typeof d.Red !== 'undefined' ||
        //     typeof d.Green !== 'undefined' ||
        //     typeof d.Blue !== 'undefined',
        // ),
      ) // return 'fail' if RGB data is defined, but shouldn't be
    return boolToStatus(
      // data.some(
      //   (d) =>
      //     typeof d.Red === 'undefined' ||
      //     typeof d.Green === 'undefined' ||
      //     typeof d.Blue === 'undefined' ||
      //     (d.Red === 0 && d.Green === 0 && d.Blue === 0),
      // ),
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
        // data.some(
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
      // data.every(
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
      // data.some(
      // newSome(
      //   data,
      //   (d) =>
      //     typeof d.X === 'undefined' ||
      //     typeof d.Y === 'undefined' ||
      //     typeof d.Z === 'undefined' ||
      //     d.X < minx ||
      //     d.X > maxx ||
      //     d.Y < miny ||
      //     d.Y > maxy ||
      //     d.Z < minz ||
      //     d.Z > maxz,
      // ),
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
      // data.some(
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
      //data.some(
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
      // data.some(
      arrayAny(
        data,
        (d) =>
          typeof d.ReturnNumber === 'undefined' ||
          typeof d.NumberOfReturns === 'undefined' ||
          d.ReturnNumber > d.NumberOfReturns,
      ),
    ),
}
// /**
//  *
//  * @param {'pass' | 'fail' | 'warn' | undefined} oldStatus
//  * @param {'pass' | 'fail' | 'warn'} newStatus
//  * @returns {'pass' | 'fail' | 'warn'}
//  */
// const overwriteStatus = (oldStatus, newStatus) => {
//   if (oldStatus === 'fail') return 'fail' // 'fail' cannot be overwritten
//   else if (oldStatus === 'warn')
//     if (newStatus === 'fail')
//       return 'fail' // 'warn' can be overwritten with 'fail'
//     else return 'warn'
//   else return newStatus // anything can overwrite 'pass'
// }

// /**
//  * @type {{[id: string]: ({copc: Copc, point: Record<string, number>, key: string}) => 'pass' | 'fail' | 'warn'}}
//  */
// const microPointDataSuite = {
//   rgb: ({
//     copc: {
//       header: { pointDataRecordFormat: pdrf },
//     },
//     point,
//   }) => {
//     if (pdrf === 6)
//       return checkPoint(
//         point,
//         (p) =>
//           typeof p.Red !== 'undefined' ||
//           typeof p.Green !== 'undefined' ||
//           typeof p.Blue !== 'undefined',
//       )
//     return checkPoint(
//       point,
//       (p) =>
//         typeof p.Red === 'undefined' ||
//         typeof p.Green === 'undefined' ||
//         typeof p.Blue === 'undefined' ||
//         (p.Red === 0 && p.Green === 0 && p.Blue === 0),
//       true,
//     )
//   },
//   rgbi: ({
//     copc: {
//       header: { pointDataRecordFormat: pdrf },
//     },
//     point,
//   }) => {
//     const hasRgb = pdrf !== 6
//     if (hasRgb) {
//       return checkPoint(
//         point,
//         (p) =>
//           typeof p.Red === 'undefined' ||
//           typeof p.Green === 'undefined' ||
//           typeof p.Blue === 'undefined',
//       )
//     }
//     return checkPoint(
//       point,
//       hasRgb
//         ? (p) =>
//             p.Red <= 255 &&
//             p.Green <= 255 &&
//             p.Blue <= 255 &&
//             p.Intensity <= 255
//         : (p) => p.Intensity <= 255,
//       true,
//     )
//   },
//   xyz: ({
//     copc: {
//       info: { cube },
//     },
//     point,
//     key,
//   }) => {
//     const [minx, miny, minz, maxx, maxy, maxz] = Bounds.stepTo(
//       cube,
//       Key.parse(key),
//     )
//     return checkPoint(
//       point,
//       (p) =>
//         typeof p.X === 'undefined' ||
//         typeof p.Y === 'undefined' ||
//         typeof p.Z === 'undefined' ||
//         p.X < minx ||
//         p.X > maxx ||
//         p.Y < miny ||
//         p.Y > maxy ||
//         p.Z < minz ||
//         p.Z > maxz,
//     )
//   },
//   gpsTime: ({
//     copc: {
//       info: {
//         gpsTimeRange: [min, max],
//       },
//     },
//     point,
//   }) => {
//     return checkPoint(
//       point,
//       (gps) =>
//         typeof gps.GpsTime === 'undefined' ||
//         gps.GpsTime < min ||
//         gps.GpsTime > max,
//     )
//   },
//   sortedGpsTime: ({ point }) => {
//     const r = checkPoint(point, (s) => s.GpsTime < prevGpsTime, true)
//     prevGpsTime = point.GpsTime
//     return r
//   },
//   returnNumber: ({ point }) => {
//     return checkPoint(
//       point,
//       (r) =>
//         typeof r.ReturnNumber === 'undefined' ||
//         typeof r.NumberOfReturns === 'undefined' ||
//         r.ReturnNumber > r.NumberOfReturns,
//     )
//   },
// }
// const suiteEntries = Object.entries(microPointDataSuite)

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

  const length = deep ? view.pointCount : 1
  const data = Array.from({ length }, (_v, i) => getDimensions(i))
  // const data = await Promise.all(
  //   Array.from({ length }, async (_v, i) => getDimensions(i)),
  // )
  const checks = Object.entries(pointDataSuite).reduce((acc, [id, f]) => {
    // console.time(`${key} ${id}`)
    acc[id] = f({ copc, key, data })
    // console.timeEnd(`${key} ${id}`)
    return acc
  }, node)

  // console.timeEnd(`${key} ${node.pointCount}`)
  return [key, checks]
}

// const pointDataChecks = ({ copc: { header, info }, key, data }) => ({
//   rgb: checkRgb(data, header.pointDataRecordFormat),
//   rgbi: checkRgbi(data, header.pointDataRecordFormat),
//   xyz: checkBounds(data, info.cube, key),
//   gpsTime: checkGpsTime(data, info.gpsTimeRange),
//   sortedGpsTime: checkGpsTimeSorted(data),
//   returnNumber: checkReturnNumber(data),
// })

// const checkRgb = (data, pdrf) => {
//   if (pdrf === 6)
//     return checkNode(
//       data,
//       (d) =>
//         typeof d.Red !== 'undefined' ||
//         typeof d.Green !== 'undefined' ||
//         typeof d.Blue !== 'undefined',
//     ) // return 'fail' if RGB data is defined, but shouldn't be
//   return checkNode(
//     data,
//     (d) =>
//       typeof d.Red === 'undefined' ||
//       typeof d.Green === 'undefined' ||
//       typeof d.Blue === 'undefined' ||
//       (d.Red === 0 && d.Green === 0 && d.Blue === 0),
//     true,
//   ) // return 'warn' if RGB data should be defined, but any point is undefined or un-utilized
// }

// const checkRgbi = (data, pdrf) => {
//   const hasRgb = pdrf !== 6
//   if (hasRgb) {
//     if (
//       isBadNode(
//         data,
//         (d) =>
//           typeof d.Red === 'undefined' ||
//           typeof d.Green === 'undefined' ||
//           typeof d.Blue === 'undefined',
//       )
//     )
//       return 'fail'
//   }
//   return checkNode(
//     data,
//     hasRgb
//       ? (d) =>
//           d.Red <= 255 && d.Green <= 255 && d.Blue <= 255 && d.Intensity <= 255
//       : (d) => d.Intensity <= 255,
//     true,
//     true,
//   )
// }

// const checkBounds = (data, bounds, key) => {
//   const [minx, miny, minz, maxx, maxy, maxz] = Bounds.stepTo(
//     bounds,
//     Key.parse(key),
//   )
//   return checkNode(
//     data,
//     (d) =>
//       typeof d.X === 'undefined' ||
//       typeof d.Y === 'undefined' ||
//       typeof d.Z === 'undefined' ||
//       d.X < minx ||
//       d.X > maxx ||
//       d.Y < miny ||
//       d.Y > maxy ||
//       d.Z < minz ||
//       d.Z > maxz,
//   )
// }

// // type gpsTimeRange = [number, number]
// const checkGpsTime = (data, [min, max]) => {
//   return checkNode(
//     data,
//     (d) =>
//       typeof d.GpsTime === 'undefined' || d.GpsTime < min || d.GpsTime > max,
//   )
// }

// const checkGpsTimeSorted = (data) => {
//   // if (!Array.isArray(data)) return 'pass' // cannot check if a single point is sorted
//   let prevGpsTime = 0
//   return checkNode(
//     data,
//     (d) => {
//       const isBad = d.GpsTime < prevGpsTime
//       prevGpsTime = d.GpsTime
//       return isBad
//     },
//     true,
//   )
// }

// const checkReturnNumber = (data) => {
//   return checkNode(
//     data,
//     (d) =>
//       typeof d.ReturnNumber === 'undefined' ||
//       typeof d.NumberOfReturns === 'undefined' ||
//       d.ReturnNumber > d.NumberOfReturns,
//   )
// }

// const pointDataSuite = {
//   rgb: ({ copc: { header }, data }) =>
//     checkRgb(data, header.pointDataRecordFormat),
//   rgbi: ({ copc: { header }, data }) =>
//     checkRgbi(data, header.pointDataRecordFormat),
//   xyz: ({
//     copc: {
//       info: { cube },
//     },
//     data,
//     key,
//   }) => checkBounds(data, cube, key),
//   gpsTime: ({
//     copc: {
//       info: { gpsTimeRange },
//     },
//     data,
//   }) => checkGpsTime(data, gpsTimeRange),
//   sortedGpsTime: ({ data }) => checkGpsTimeSorted(data),
//   returnNumber: ({ data }) => checkReturnNumber(data),
// }

// const checkRgb = (data, pdrf) => {
//   if (pdrf === 6)
//     return checkNode(
//       data,
//       (d) =>
//         typeof d.Red !== 'undefined' ||
//         typeof d.Green !== 'undefined' ||
//         typeof d.Blue !== 'undefined',
//     ) // return 'fail' if RGB data is defined, but shouldn't be
//   return checkNode(
//     data,
//     (d) =>
//       typeof d.Red === 'undefined' ||
//       typeof d.Green === 'undefined' ||
//       typeof d.Blue === 'undefined' ||
//       (d.Red === 0 && d.Green === 0 && d.Blue === 0),
//     true,
//   ) // return 'warn' if RGB data should be defined, but any point is undefined or un-utilized
// }

// const checkRgbi = (data, pdrf) => {
//   const hasRgb = pdrf !== 6
//   if (hasRgb) {
//     if (
//       isBadNode(
//         data,
//         (d) =>
//           typeof d.Red === 'undefined' ||
//           typeof d.Green === 'undefined' ||
//           typeof d.Blue === 'undefined',
//       )
//     )
//       return 'fail'
//   }
//   return checkNode(
//     data,
//     hasRgb
//       ? (d) =>
//           d.Red <= 255 && d.Green <= 255 && d.Blue <= 255 && d.Intensity <= 255
//       : (d) => d.Intensity <= 255,
//     true,
//     true,
//   )
// }

// const checkBounds = (data, bounds, key) => {
//   const [minx, miny, minz, maxx, maxy, maxz] = Bounds.stepTo(
//     bounds,
//     Key.parse(key),
//   )
//   return checkNode(
//     data,
//     (d) =>
//       typeof d.X === 'undefined' ||
//       typeof d.Y === 'undefined' ||
//       typeof d.Z === 'undefined' ||
//       d.X < minx ||
//       d.X > maxx ||
//       d.Y < miny ||
//       d.Y > maxy ||
//       d.Z < minz ||
//       d.Z > maxz,
//   )
// }

// // type gpsTimeRange = [number, number]
// const checkGpsTime = (data, [min, max]) => {
//   return checkNode(
//     data,
//     (d) =>
//       typeof d.GpsTime === 'undefined' || d.GpsTime < min || d.GpsTime > max,
//   )
// }

// const checkGpsTimeSorted = (data) => {
//   if (!Array.isArray(data)) return 'pass' // cannot check if a single point is sorted
//   let prevGpsTime = 0
//   return checkNode(
//     data,
//     (d) => {
//       const isBad = d.GpsTime < prevGpsTime
//       prevGpsTime = d.GpsTime
//       return isBad
//     },
//     true,
//   )
// }

// const checkReturnNumber = (data) => {
//   return checkNode(
//     data,
//     (d) =>
//       typeof d.ReturnNumber === 'undefined' ||
//       typeof d.NumberOfReturns === 'undefined' ||
//       d.ReturnNumber > d.NumberOfReturns,
//   )
// }

// const checkNode = (data, check, warning = false, every = false) =>
//   boolToStatus(!isBadNode(data, check, every), warning)

// /**
//  *
//  * @param data
//  * @param check
//  * @param every
//  * @returns `true` if Node violates the specs, `false` if Node checks out OK
//  */
// const isBadNode = (data, check, every = false) =>
//   Array.isArray(data)
//     ? every
//       ? data.every((d) => check(d))
//       : data.some((d) => check(d))
//     : check(data)
