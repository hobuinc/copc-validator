import { CopcChecks, LasChecks } from '../checks'
import { generateReport } from '../report'

export default async (source: string, name?: string) =>
  generateReport(source, CopcChecks, LasChecks, { name, type: 'quick' })
