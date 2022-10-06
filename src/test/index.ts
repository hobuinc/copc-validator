import { Copc, Getter, Hierarchy } from 'copc'
import { join } from 'path'

export const dirname = __dirname
const filename = 'ellipsoid.copc.laz'
export const ellipsoidFilename = join(dirname, 'data', filename)
export const ellipsoidFiles = {
  oldCopc: join(dirname, 'data', 'old-ellipsoid.copc.laz'),
  copc: join(dirname, 'data', 'ellipsoid.copc.laz'),
  laz: join(dirname, 'data', 'ellipsoid.laz'),
  laz14: join(dirname, 'data', 'ellipsoid-1.4.laz'),
}

/**
 * Used to quickly turn a `Getter` object into the relevant Copc items for
 * jest tests. Defaults to the `copc` test ellipsoid since most tests utilize
 * that file, but can supply any `Getter` (as long as it works for `Copc.create()`)
 * @param get Getter to create `copc` and `nodes` objects
 * default: ellipsoidFiles.copc
 * @returns {Promise<{get: Getter, copc: Copc, nodes: Hierarchy.Node.Map}>} `{ get, copc, nodes }`
 */
export const getItems = async (
  get: string | Getter = ellipsoidFiles.copc,
): Promise<{ get: Getter; copc: Copc; nodes: Hierarchy.Node.Map }> => ({
  get: Getter.create(get),
  copc: await Copc.create(get),
  nodes: (
    await Copc.loadHierarchyPage(
      get,
      (
        await Copc.create(get)
      ).info.rootHierarchyPage,
    )
  ).nodes,
})

// type ellipsoidNodePoint = {
//   path: string
//   rootPoint: {
//     X: number
//     Y: number
//     Z: number
//     Intensity: number
//     ReturnNumber: number
//     NumberOfReturns: number
//     Synthetic: number
//     KeyPoint: number
//     Withheld: number
//     Overlap: number
//     ScannerChannel: number
//     ScanDirectionFlag: number
//     EdgeOfFlightLine: number
//     Classification: number
//     UserData: number
//     ScanAngle: number
//     PointSourceId: number
//     GpsTime: number
//     Red: number
//     Green: number
//     Blue: number
//     InvertedIntensity: number
//   }
// }
