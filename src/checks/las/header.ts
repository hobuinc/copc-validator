import { basicCheck, complexCheck } from '../../checks'
import { Las } from 'copc'
import { Check } from 'types'

export const header: Check.Suite<Las.Header> = {
  minorVersion: (h) => basicCheck(h.minorVersion, 4),
  pointDataRecordFormat: (h) =>
    complexCheck(
      h.pointDataRecordFormat,
      [6, 7, 8],
      false,
      `Point Data Record Format (should be 6,7,8): ${h.pointDataRecordFormat}`,
    ),
}

export default header
