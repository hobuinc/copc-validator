import { CopcSuite, CopcGetterSuite } from '../checks'
import { generateReport } from '../report'

export default async (source: string, name?: string) =>
  generateReport(source, CopcSuite, CopcGetterSuite, {
    name: name || source,
    type: 'quick',
  })
