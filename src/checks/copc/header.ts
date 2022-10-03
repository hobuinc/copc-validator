import { Copc, Las } from 'copc'
import { basicCheck } from '../../checks'
import { Check } from 'types'

export const header: Check.Suite<Copc> = {
  // This check is redundant with Las.Header.parse() (in Copc.create())
  fileSignature: (c) => basicCheck(c.header.fileSignature, 'LASF'),
  // This check is redundant with Copc.create()
  majorVersion: (c) => basicCheck(c.header.majorVersion, 1),
  // This check is not redundant with Copc.create() since it currently allows minorVersion === 2
  minorVersion: (c) => basicCheck(c.header.minorVersion, 4),
  headerLength: (c) =>
    basicCheck(c.header.headerLength, Las.Constants.minHeaderLength),
  pointDataRecordFormat: (c) =>
    basicCheck(c.header.pointDataRecordFormat, [6, 7, 8]),
  pointCountByReturn: (c) =>
    basicCheck(
      c.header.pointCountByReturn.reduce((prev, curr) => prev + curr, 0),
      c.header.pointCount,
    ),
}

export default header
