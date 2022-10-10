import { Getter, Las } from 'copc'
import headerSuite from './header'
import vlrSuite from '../vlrs'
import { Check } from 'types'
import { invokeAllChecks } from '../../checks'

// TODO: Rewrite LAS checks

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
