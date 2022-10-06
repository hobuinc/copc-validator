import { Check } from 'types'
import header from './header'
import vlrs from './vlrs'
import hierarchy from './hierarchy'
import { Copc, Getter } from 'copc'
import { invokeAllChecks } from '../../checks'

const copcSuite = { ...header, ...vlrs }
const copcGetSuite = { ...hierarchy }

// Swapped different Suite types for a single Check.NestedSuite<Getter> object,
// which simplifies the generateReport() parameters for both Copc and Las files,
// and especially so for adding future tests or suites
export const CopcSuite: Check.Suite<Getter> = {
  suites: async (get) => {
    // no need to wrap in try...catch since `await Copc.create(get)` is already
    // tested inside the try {} of generateReport()
    const copc = await Copc.create(get)
    // Wrapped different suites together since they both expect a valid Copc object
    return invokeAllChecks([
      { source: copc, suite: copcSuite },
      { source: { get, copc }, suite: copcGetSuite },
    ])
  },
}
