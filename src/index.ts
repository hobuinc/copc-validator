import { ellipsoidFilename } from './test'
import { Copc } from 'copc'
import quick from './quick'

Copc.create(ellipsoidFilename).then((copc) =>
  console.log(quick(copc, ellipsoidFilename)),
)
