import { ellipsoidFilename } from './test'
import quick from './report/quick'

const filename = process.argv[2] || ellipsoidFilename

quick(filename).then((r) => console.dir(r, { depth: null }))
