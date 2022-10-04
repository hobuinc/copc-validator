import { invokeAllChecks } from 'checks/utils'
import {
  enhancedHierarchyNodes,
  getNodePoint,
  fullHierarchyNodes,
  getNodePoints,
} from './common'
import { Copc, Getter, Hierarchy } from 'copc'
import { ellipsoidFiles } from 'test'
import { reduce } from 'lodash'

/**
 * Used to quickly turn a `Getter` object into the relevant Copc items for
 * jest tests. Defaults to the `copc` test ellipsoid since most tests utilize
 * that file, but can supply any `Getter` (as long as it works for `Copc.create()`)
 * @param get Getter to create `copc` and `nodes` objects
 * default: ellipsoidFiles.copc
 * @returns {Promise<{get: Getter, copc: Copc, nodes: Hierarchy.Node.Map}>} `{ get, copc, nodes }`
 */
export const getItems = async (
  get: Getter = Getter.create(ellipsoidFiles.copc),
): Promise<{ get: Getter; copc: Copc; nodes: Hierarchy.Node.Map }> => ({
  get,
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

const items = getItems()

test('enhancedHierarchyNodes', async () => {
  const { get, copc, nodes } = await items
  const pd = enhancedHierarchyNodes(nodes, await getNodePoint(get, copc, nodes))
  Object.entries(pd).forEach(([path, { root }]) =>
    expect(root).toMatchObject(pd[path].root),
  )
})
test.todo('enhancedHierarchyNodes expect statements')

// Commented out because the following test takes over 11 minutes, even for
// the tiny ellipsoid test file:

// test('fullHierarchyNodes', async () => {
//   const { get, copc, nodes } = await items
//   const pd = fullHierarchyNodes(nodes, await getNodePoints(get, copc, nodes))
//   console.log(pd)
// })
