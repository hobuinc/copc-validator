import { ellipsoidFilename, ellipsoidFiles } from './test'
import quick from './report/quick'

const filename = process.argv[2] || ellipsoidFiles.copc

const start = performance.now()
quick(filename)
  .then((r) => console.dir(r, { depth: null }))
  .then((r) => {
    const end = performance.now()
    console.log(`Time: ${end - start}ms`)
  })
