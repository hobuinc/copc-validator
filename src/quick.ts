import { Copc } from 'copc'
import { Check, Report } from './types'
import { generateChecks, AllChecks } from './checks'
import { omit } from 'lodash'

const QuickChecks: Check.Groups = AllChecks

export default async (source: string, name?: string): Promise<Report> => {
  const start = new Date()
  const reportName = name || source
  try {
    const copc = await Copc.create(source)
    const checks = generateChecks(copc, QuickChecks)
    const { header, vlrs, info } = copc
    return {
      name: reportName,
      scan: { type: 'quick', result: 'COPC', start, end: new Date() },
      checks,
      copc: {
        header,
        vlrs,
        info,
      },
    }
  } catch (e) {
    return {
      name: reportName,
      scan: { type: 'quick', result: 'Unknown', start, end: new Date() },
      checks: [],
      error: e as Error,
    }
  }
}
