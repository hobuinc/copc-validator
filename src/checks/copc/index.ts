import { Check } from 'types'
import header from './header'
import vlrSuite from 'checks/las/vlrs'
import { Copc, Getter } from 'copc'
import { invokeAllChecks } from 'checks'
// reads copcHeaderSuite as {} if imported from 'checks'
import { copcHeaderSuite } from '../getter'
import nodeScanSuite from './nodes'
import { copcWithGetter } from './common'

const copcSuite: Check.Suite<Copc> = { ...header, ...vlrSuite }
const getterSuite: Check.Suite<Getter> = { ...copcHeaderSuite }

export const CopcSuite = (
  deep: boolean = false,
): Check.Suite<copcWithGetter> => ({
  suites: async ({ get, copc }) =>
    invokeAllChecks([
      { source: copc, suite: copcSuite },
      { source: get, suite: getterSuite },
      { source: { get, copc, deep }, suite: nodeScanSuite },
    ]),
})

// export shallow scan by default
export default CopcSuite()
