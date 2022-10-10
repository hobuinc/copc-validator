import { basicCheck, complexCheck, invokeAllChecks } from '../../checks'
import { Binary, getBigUint64, Getter, Las, parseBigInt } from 'copc'
import { Check } from 'types'
import lasHeaderSuite from '../las/header'

export const header: Check.Suite<{
  get: Getter
  buffer: Binary
  dv: DataView
}> = {
  lasParse: async ({ buffer, dv }) => {
    try {
      const header = Las.Header.parse(buffer)
      // If Las.Header.parse() didn't throw the error, we can reuse the lasHeaderSuite checks
      return invokeAllChecks({ source: header, suite: lasHeaderSuite })
    } catch (error) {
      return invokeAllChecks({ source: { buffer, dv }, suite: headerChecks })
    }
  },
}

export const headerChecks: Check.Suite<{ buffer: Binary; dv: DataView }> = {
  fileSignature: ({ buffer }) => {
    const fileSignature = Binary.toCString(buffer.slice(0, 4))
    return complexCheck(
      fileSignature,
      'LASF',
      false,
      `('LASF') File Signature: '${fileSignature}'`,
    )
  },
  majorVersion: ({ buffer }) => {
    const majorVersion = Binary.toDataView(buffer).getUint8(24)
    return complexCheck(
      majorVersion,
      1,
      false,
      `(1) Major Version: ${majorVersion}`,
    )
  },
  minorVersion: ({ buffer }) => {
    const minorVersion = Binary.toDataView(buffer).getUint8(25)
    return complexCheck(
      minorVersion,
      4,
      false,
      `(4) Minor Version: ${minorVersion}`,
    )
  },
  headerLength: ({ dv }) => {
    const headerLength = dv.getUint16(94, true)
    return complexCheck(
      headerLength,
      (n) => n >= Las.Constants.minHeaderLength,
      false,
      `(>=375) Header Length: ${headerLength}`,
    )
  },
}

export default header

/* FROM `copc.js`:
const header: Header = {
  fileSignature,
  fileSourceId: dv.getUint16(4, true),
  globalEncoding: dv.getUint16(6, true),
  projectId: formatGuid(buffer.slice(8, 24)),
  majorVersion,
  minorVersion,
  systemIdentifier: Binary.toCString(buffer.slice(26, 58)),
  generatingSoftware: Binary.toCString(buffer.slice(58, 90)),
  fileCreationDayOfYear: dv.getUint16(90, true),
  fileCreationYear: dv.getUint16(92, true),
  headerLength: dv.getUint16(94, true),
  pointDataOffset: dv.getUint32(96, true),
  vlrCount: dv.getUint32(100, true),
  pointDataRecordFormat: dv.getUint8(104) & 0b1111,
  pointDataRecordLength: dv.getUint16(105, true),
  pointCount: dv.getUint32(107, true),
  pointCountByReturn: parseLegacyNumberOfPointsByReturn(
    buffer.slice(111, 131)
  ),
  scale: parsePoint(buffer.slice(131, 155)),
  offset: parsePoint(buffer.slice(155, 179)),
  min: [
    dv.getFloat64(187, true),
    dv.getFloat64(203, true),
    dv.getFloat64(219, true),
  ],
  max: [
    dv.getFloat64(179, true),
    dv.getFloat64(195, true),
    dv.getFloat64(211, true),
  ],
  waveformDataOffset: 0,
  evlrOffset: 0,
  evlrCount: 0,
}

if (minorVersion == 2) return header

return {
  ...header,
  pointCount: parseBigInt(getBigUint64(dv, 247, true)),
  pointCountByReturn: parseNumberOfPointsByReturn(buffer.slice(255, 375)),
  waveformDataOffset: parseBigInt(getBigUint64(dv, 227, true)),
  evlrOffset: parseBigInt(getBigUint64(dv, 235, true)),
  evlrCount: dv.getUint32(243, true),
}
*/
