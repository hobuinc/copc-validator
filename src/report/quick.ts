import { CopcSuite, CopcGetterSuite, PostHierarchySuite } from '../checks'
import { generateReport } from '../report'

export default async (source: string, name?: string) =>
  generateReport(source, CopcSuite, CopcGetterSuite, PostHierarchySuite, {
    name: name || source,
    type: 'quick',
  })
