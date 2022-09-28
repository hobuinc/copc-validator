import { Copc, Las } from 'copc'
import { basicCheck } from '../../checks'
import { Check } from 'types'

export const header: Check.Suite<Copc> = {
  // This check is redundant with Las.Header.parse() (in Copc.create())
  'header.fileSignature': (c) => basicCheck(c.header.fileSignature, 'LASF'),
  // This check is redundant with Copc.create()
  'header.majorVersion': (c) => basicCheck(c.header.majorVersion, 1),
  // This check is not redundant with Copc.create() since it currently allows minorVersion === 2
  'header.minorVersion': (c) => basicCheck(c.header.minorVersion, 4),
  'header.headerLength': (c) =>
    basicCheck(c.header.headerLength, Las.Constants.minHeaderLength),
  'header.pointDataRecordFormat': (c) =>
    basicCheck(c.header.pointDataRecordFormat, [6, 7, 8]),
}

export default header
