import { Getter, Las } from 'copc'
import headerSuite from './header'
import vlrSuite from 'checks/las/vlrs'
import { Check } from 'types'
import { invokeAllChecks } from 'checks'

export * from './vlrs'

// TODO: Rewrite LAS checks/write more LAS checks that allow validating the
// Las 1.4 spec instead of just checking against the COPC spec

// Currently (10/12/2022 @ ~3:30pm), this suite is written to check why the Copc
// suite was unable to run (`Copc.create()` failed, so dig deeper)
export const LasSuite: Check.Suite<{
  get: Getter
  header: Las.Header
  vlrs: Las.Vlr[]
}> = {
  lasParse: async ({ header, vlrs }) =>
    invokeAllChecks([
      { source: header, suite: headerSuite },
      { source: { header, vlrs }, suite: vlrSuite },
    ]),
}
