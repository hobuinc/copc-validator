import { basicCheck, complexCheck } from 'checks'
import { Las } from 'copc'
import { Check } from 'types'

// This Suite contains Checks to validate data against the COPC spec. I should be able
// to make another suite of similar functions to validate against the Las 1.4 spec instead

// If Check.Suite<Las.Header> is being called from generateReport(), then both
// Las.Header.parse() and Las.Vlr.walk() succeeded. This is actually fairly unlikely,
// as those two functions hold like 75% of Copc.create()'s exit paths.

// This Suite is used by checks/copc/header.ts to confirm the Las.Header
// values adhear to the COPC spec. It likely won't be called from generateReport()
// once I fully implement LAS spec validation
export const headerSuite: Check.Suite<Las.Header> = {
  minorVersion: ({ minorVersion }) => basicCheck(minorVersion, 4),
  pointDataRecordFormat: ({ pointDataRecordFormat }) =>
    complexCheck(
      pointDataRecordFormat,
      [6, 7, 8],
      false,
      `Point Data Record Format (should be 6, 7, or 8): ${pointDataRecordFormat}`,
    ),
  headerLength: ({ headerLength }) =>
    basicCheck(headerLength, Las.Constants.minHeaderLength),
  pointCountByReturn: ({ pointCount, pointCountByReturn }) =>
    basicCheck(
      pointCountByReturn.reduce((p, c) => p + c, 0),
      pointCount,
    ),
}

export default headerSuite
