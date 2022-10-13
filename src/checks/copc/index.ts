import { Check } from 'types'
import header, { headerGetter } from './header'
import vlrSuite from 'checks/las/vlrs'
import { Copc, Getter } from 'copc'
import { invokeAllChecks } from 'checks'
import nodeScanSuite from './nodes'

const copcSuite: Check.Suite<Copc> = { ...header, ...vlrSuite }
const getterSuite: Check.Suite<Getter> = { ...headerGetter }

export const buildCopcSuite = (
  deep: boolean = false,
): Check.Suite<{ get: Getter; copc: Copc }> => ({
  suites: async ({ get, copc }) =>
    invokeAllChecks([
      { source: copc, suite: copcSuite },
      { source: get, suite: getterSuite },
      { source: { get, copc, deep }, suite: nodeScanSuite },
    ]),
})
