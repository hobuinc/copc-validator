import { ellipsoidFilename, ellipsoidFiles } from './test'
import quick from './report/quick'

const filename = process.argv[2] || ellipsoidFiles.copc

quick(filename).then((r) => console.dir(r, { depth: null }))
