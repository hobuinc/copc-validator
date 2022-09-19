import { ellipsoidFilename } from './test'
import quick from './quick'

const filename = process.argv[2] || ellipsoidFilename

quick(filename).then((r) => console.log(r))
