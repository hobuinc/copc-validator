// export default async ({ dims, count }) =>
//   Array.from(new Array(count), (_v, i) => dims(i))
const { Getter, Copc } = require('copc')
const { map } = require('lodash')

module.exports = async ({ filename, node, deep }) => {
  const get = Getter.create(filename)
  const copc = await Copc.create(get)
  // const { nodes } = await Copc.loadHierarchyPage(
  //   get,
  //   copc.info.rootHierarchyPage,
  // )
  // const node = nodes[key]
  // if (!node) throw new Error(`Invalid key: ${key}`)
  const view = await Copc.loadPointDataView(get, copc, node)
  const dimensions = Object.keys(view.dimensions)
  const getDimensions = (idx) =>
    dimensions
      .map(view.getter)
      .reduce((prev, curr, i) => ({ ...prev, [dimensions[i]]: curr(idx) }), {})
  return deep
    ? Array.from(new Array(view.pointCount), (_v, i) => getDimensions(i))
    : getDimensions(0)
}
