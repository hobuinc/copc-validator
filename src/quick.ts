import { Copc } from 'copc'
import { Check, Report } from './types'
import { generateChecks, AllChecks } from './checks'
import { omit } from 'lodash'

const QuickChecks: Check.Groups = AllChecks

export default (source: Copc, name?: string): Report => {
  const start = new Date()
  const checks = generateChecks(source, QuickChecks)
  const { header, vlrs, info } = source
  return {
    file: name || 'undefined',
    scan: { type: 'quick', start, end: new Date() },
    header,
    vlrs,
    info,
    checks,
  }
}
