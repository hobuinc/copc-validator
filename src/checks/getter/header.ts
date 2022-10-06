import { basicCheck, complexCheck } from '../../checks'
import { Binary } from 'copc'
import { Check } from 'types'

export const header: Check.Suite<Binary> = {
  fileSignature: (b) => {
    const fileSignature = Binary.toCString(b.slice(0, 4))
    return basicCheck(
      fileSignature,
      'LASF',
      `('LASF') File Signature: '${fileSignature}'`,
    )
  },
  majorVersion: (b) => {
    const majorVersion = Binary.toDataView(b).getUint8(24)
    return complexCheck(
      majorVersion,
      1,
      false,
      `(1) Major Version: ${majorVersion}`,
    )
  },
  minorVersion: (b) => {
    const minorVersion = Binary.toDataView(b).getUint8(25)
    return complexCheck(
      minorVersion,
      4,
      false,
      `(4) Minor Version: ${minorVersion}`,
    )
  },
}

export default header
