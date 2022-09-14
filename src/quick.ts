import { Copc } from 'copc'
import { Report } from './types'
import { generateChecks } from './checks'

export default (source: Copc, name?: string): Report => {
  const start = new Date()
  const checks = generateChecks(source)
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
