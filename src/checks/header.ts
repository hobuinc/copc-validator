import { Check } from 'types'

export const header: Check.Group = {
  'header.fileSignature': (c) => c.header.fileSignature === 'LASF',
  'header.majorVersion': (c) => c.header.majorVersion === 1,
  'header.minorVersion': (c) => c.header.minorVersion === 4,
  'header.pointDataRecordFormat': (c) =>
    [6, 7, 8].includes(c.header.pointDataRecordFormat),
}

export default header
