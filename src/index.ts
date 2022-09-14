import { Copc } from 'copc'
;(async () => {
  const filename = process.argv[2] || '../autzen-classified.copc.laz'
  console.log('filename', filename)

  const copc = await Copc.create(filename)
  console.log(copc)

  const { nodes, pages } = await Copc.loadHierarchyPage(
    filename,
    copc.info.rootHierarchyPage,
  )
  const root = nodes['0-0-0-0']!
  const view = await Copc.loadPointDataView(filename, copc, root)
  console.log('Dimensions:', view.dimensions)

  const getters = ['X', 'Y', 'Z', 'Intensity', 'Red', 'Green', 'Blue'].map(
    view.getter,
  )
  function getXyzirgb(index: number) {
    return getters.map((get) => get(index))
  }

  // for (let i = 0; i < copc.header.pointCount; i++) {
  //   const isEoFL = getEoFL(i)
  //   console.log(isEoFL)
  // }

  // for (let i = 0; i < copc.header.pointCount; i++) {
  //   const point = getXyzirgb(i)
  //   console.log(`Point ${i}:`, point)
  // }
  const point = getXyzirgb(0)
  console.log('Point:', point)
})()

// const copc = (async () => {
//   const copc = await Copc.create(filename)
//   console.log(copc)
//   return copc
// })()
//   .then((copc) => console.log(copc))
//   .catch((e) => console.log(e))
