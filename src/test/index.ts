import { Copc, Getter, Hierarchy, Las } from 'copc'
import { join } from 'path'

export const dirname = __dirname
const filename = 'ellipsoid.copc.laz'
export const ellipsoidFilename = join(dirname, 'data', filename)
export const ellipsoidFiles = {
  oldCopc: join(dirname, 'data', 'old-ellipsoid.copc.laz'),
  copc: join(dirname, 'data', 'ellipsoid.copc.laz'),
  laz: join(dirname, 'data', 'ellipsoid.laz'),
  laz14: join(dirname, 'data', 'ellipsoid-1.4.laz'),
  fake: join(dirname, 'data', 'fake-copc.txt'),
}

/**
 * Used to quickly turn a `Getter` object into the relevant Copc items for
 * jest tests. Defaults to the `copc` test ellipsoid since most tests utilize
 * that file, but can supply any `Getter` (as long as it works for `Copc.create()`)
 * @param get Getter to create `copc` and `nodes` objects
 * default: ellipsoidFiles.copc
 * @returns {Promise<{get: Getter, copc: Copc, nodes: Hierarchy.Node.Map}>} `{ get, copc, nodes }`
 */
export const getCopcItems = async (
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

export const getLasItems = async (
  getter: string | Getter = ellipsoidFiles.laz14,
): Promise<{ get: Getter; header: Las.Header; vlrs: Las.Vlr[] }> => {
  const get = Getter.create(getter)
  const header = Las.Header.parse(await get(0, Las.Constants.minHeaderLength))
  return { get, header, vlrs: await Las.Vlr.walk(get, header) }
}
