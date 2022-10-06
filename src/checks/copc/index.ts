import { Check } from 'types'
import header from './header'
import vlrs from './vlrs'
import hierarchy from './hierarchy'
import { Copc, Getter } from 'copc'
import { invokeAllChecks } from '../../checks'

// Swapped different Suite types for a single Check.NestedSuite<Getter> object,
// which simplifies the generateReport() parameters for both Copc and Las files,
// and especially so for adding future tests or suites
export const CopcSuite: Check.Suite<Getter> = {
  copc: async (get) => {
    try {
      const copc = await Copc.create(get)
      // Spread all Check.Suite<Copc> objects here for export
      return invokeAllChecks({ source: copc, suite: { ...header, ...vlrs } })
    } catch (error) {
      return [{ id: 'copc-NestedSuite', status: 'fail', info: error }]
    }
  },
  hierarchy: async (get) => {
    try {
      const copc = await Copc.create(get)
      // Spread all Check.Suite<{get: Getter, copc: Copc}> objects here for export
      return invokeAllChecks({ source: { get, copc }, suite: { ...hierarchy } })
    } catch (error) {
      return [{ id: 'hierarchy-NestedSuite', status: 'fail', info: error }]
    }
  },
}
