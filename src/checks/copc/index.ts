import { Check, Report } from 'types'
import header from './header'
import vlrs from './vlrs'
import hierarchy from './hierarchy'
import { Copc, Getter, Las } from 'copc'
import { HierarchyCheckParams } from './common'

export const CopcSuite: Check.Suite<Copc> = {
  ...header,
  ...vlrs,
}

export const CopcGetterSuite: Check.Suite<HierarchyCheckParams> = {
  ...hierarchy,
}
