import type { Copc } from 'copc'
import { Check } from 'types'
import header from './header'
import info from './info'
import { flattenDeep, map } from 'lodash'

const checkFns = {
  header,
  // vlrs,
  info,
}

export const generateChecks = (c: Copc): Check[] => {
  return flattenDeep(
    map(checkFns, (checks, section) => checks.generate(c, checks, section)),
  )
}
