import { CopcSuite, GetterSuite, LasSuite } from '../checks'
import { generateReport } from '../report'

// The thought is that src/report/full.ts will essentially be the same file as
// this, just with more Check.Functions in the imported suites
export default async (source: string, name?: string) =>
  generateReport(source, CopcSuite, LasSuite, GetterSuite, {
    name: name || source,
    type: 'quick',
  })
