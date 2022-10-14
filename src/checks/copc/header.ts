import { Copc, Las } from 'copc'
import { basicCheck, headerSuite, invokeAllChecks } from 'checks'
import { Check } from 'types'

// I'm not sure what the point of this file is anymore but I'm working on it

// If Check.Suite<Copc> is being called, then Copc.create() succeeded. So for
// this header suite, I can ignore any Las.Header.parse() errors.

// Las.Header.parse() is no help for checking Legacy values of valid Copc files,
// so I definitely need a Getter or Binary suite to check those

// Solution?: checks/getter/header.ts can be a Check.Suite<Getter> that parses the
// Las header (without validation) and runs an additional Check.Suite<Las.Header & legacyValues>
// Can come with defaulted suite that checks for all COPC values, but for the CopcSuite
// it could be overwritten with just the legacyPointCount and legacyPointCountByReturn checks

// Writing this out helped a lot and I did exactly as stated above. I'll leave my comments for one commit
// export const header: Check.Suite<Copc> = {
//   minorVersion: ({ header }) => basicCheck(header.minorVersion, 4),
//   headerLength: ({ header }) =>
//     basicCheck(header.headerLength, Las.Constants.minHeaderLength),
//   pointDataRecordFormat: ({ header }) =>
//     basicCheck(header.pointDataRecordFormat, [6, 7, 8]),
//   pointCountByReturn: ({ header }) =>
//     basicCheck(
//       header.pointCountByReturn.reduce((prev, curr) => prev + curr, 0),
//       header.pointCount,
//     ),
// }

// After writing out the above, I did something similar for checks/las/header.ts
// and it helped me realize I could do this:
export const header: Check.Suite<Copc> = {
  header: ({ header }) =>
    invokeAllChecks({ source: header, suite: headerSuite }),
}

export default header
