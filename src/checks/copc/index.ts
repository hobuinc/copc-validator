import { Check } from 'types'
import header from './header'
import vlrs from './vlrs'
import hierarchy from './hierarchy'
import { Copc } from 'copc'
import { EnhanchedHierarchyParams, HierarchyCheckParams } from './common'
import { pointData } from './point-data'

export const CopcSuite: Check.Suite<Copc> = {
  ...header,
  ...vlrs,
}

export const CopcGetterSuite: Check.Suite<HierarchyCheckParams> = {
  ...hierarchy,
}

export const PostHierarchySuite: Check.Suite<EnhanchedHierarchyParams> = {
  ...pointData,
}
