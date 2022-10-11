import { Check } from 'types'
import header from './header'
import vlrs from '../vlrs'
import hierarchy from './hierarchy'
import { Copc, Getter } from 'copc'
import { invokeAllChecks } from '../../checks'
import { pick } from 'lodash'

const copcSuite = { ...header, ...vlrs }
// there should be a more elegant solution than this, possibly replacing the
// hierarchy.ts mess with pointdata.ts and deep-pointdata.ts that export their
// respective nested suites
const copcGetSuite = pick(hierarchy, 'hierarchyNestedSuite')
const copcGetSuiteDeep = pick(hierarchy, 'hierarchyNestedSuiteDeep')

// Swapped different Suite types for a single Check.NestedSuite<Getter> object,
// which simplifies the generateReport() parameters for both Copc and Las files,
// and especially so for adding future tests or suites
export const CopcSuite: Check.Suite<{ get: Getter; copc: Copc }> = {
  suites: async ({ get, copc }) => {
    // no need to wrap in try...catch since `await Copc.create(get)` is already
    // tested inside the try {} of generateReport()
    return invokeAllChecks([
      { source: copc, suite: copcSuite },
      { source: { get, copc }, suite: copcGetSuite },
    ])
  },
}

export const CopcSuiteDeep: Check.Suite<{ get: Getter; copc: Copc }> = {
  suites: async ({ get, copc }) =>
    invokeAllChecks([
      { source: copc, suite: copcSuite },
      { source: { get, copc }, suite: copcGetSuiteDeep },
    ]),
}
