import { join } from 'path'

export const dirname = __dirname
const filename = 'ellipsoid.copc.laz'
export const ellipsoidFilename = join(dirname, 'data', filename)
export const ellipsoidFiles = {
  copc: join(dirname, 'data', 'ellipsoid.copc.laz'),
  laz: join(dirname, 'data', 'ellipsoid.laz'),
  laz14: join(dirname, 'data', 'ellipsoid-1.4.laz'),
}
