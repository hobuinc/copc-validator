import { Check } from 'types'
import header, { headerGetter } from './header'
import vlrs from 'checks/vlrs'
import { Copc, Getter } from 'copc'
import { invokeAllChecks } from 'checks'
import shallowNodeScan from './pointdata'
import deepNodeScan from './pointdata-deep'
import { copcWithGetter } from './common'

const copcSuite: Check.Suite<Copc> = { ...header, ...vlrs }
const getterSuite: Check.Suite<Getter> = { ...headerGetter }

const buildCopcSuite = (
  copcGetSuite: Check.Suite<copcWithGetter>,
): Check.Suite<copcWithGetter> => ({
  suites: async ({ get, copc }) =>
    invokeAllChecks([
      { source: copc, suite: copcSuite },
      { source: get, suite: getterSuite },
      { source: { get, copc }, suite: copcGetSuite },
    ]),
})

export const CopcSuite = buildCopcSuite(shallowNodeScan)
export const CopcSuiteDeep = buildCopcSuite(deepNodeScan)
