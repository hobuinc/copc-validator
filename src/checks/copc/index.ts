import { Check } from 'types'
import header from './header'
import vlrs from './vlrs'
import hierarchy from './hierarchy'
import { Copc } from 'copc'
import { HierarchyCheckParams } from './common'

// Spread all Check.Suite<Copc> objects here for export
export const CopcSuite: Check.Suite<Copc> = {
  ...header,
  ...vlrs,
}

// Spread all Check.Suite<{get: Getter, copc: Copc}> objects here for export
export const CopcGetterSuite: Check.Suite<HierarchyCheckParams> = {
  ...hierarchy,
}
