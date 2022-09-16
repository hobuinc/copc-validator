import type { Copc } from 'copc'
import { Check } from 'types'
import header from './header'
import vlrs from './vlrs'
import info from './info'
import { flattenDeep, map } from 'lodash'
import { mapChecks } from './common'

export const AllChecks: Check.Groups = {
  header,
  vlrs,
  info,
}
export const generateChecks = (c: Copc, g: Check.Groups): Check[] =>
  flattenDeep(map(g, (checks) => mapChecks(c, checks)))
