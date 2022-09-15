import { ellipsoidFilename } from './test'
import { Copc } from 'copc'
import quick from './quick'

const filename = process.argv[2] || ellipsoidFilename

Copc.create(filename).then((copc) => console.log(quick(copc, filename)))
