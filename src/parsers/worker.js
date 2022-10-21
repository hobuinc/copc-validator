const { Getter, Copc } = require('copc')

module.exports = async ({ filepath, node, deep }) => {
  const get = Getter.create(filepath)
  const copc = await Copc.create(get)
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
