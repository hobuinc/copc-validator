import { Copc, Las } from 'copc'
import { basicCheck, headerSuite, invokeAllChecks } from 'checks'
import { Check } from 'types'

export const header: Check.Suite<Copc> = {
  header: ({ header }) =>
    invokeAllChecks({ source: header, suite: headerSuite }),
}

export default header
