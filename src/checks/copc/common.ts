import type { Copc } from 'copc'
import { Check } from 'types'
import { map } from 'lodash'

export const Messages = {
  moreInfoOnFullScan: 'Run a Full Scan for more information',
}

// export const performCheck = (c: Copc, f: Check.Function, id: string): Check => {
//   const result = f(c)
//   if (typeof result === 'boolean')
//     return { id, status: result ? 'pass' : 'fail' }
//   const { status, info } = result
//   return { id, status, info }
// }

// export const mapChecks = (c: Copc, dict: Check.Group) =>
//   map(dict, (check, id) => performCheck(c, check, id))
