import { CopcSuiteDeep, GetterSuite, LasSuite } from 'checks'
import { generateReport } from 'report'

export const deepScan = (source: string, name?: string) =>
  generateReport(source, CopcSuiteDeep, LasSuite, GetterSuite, {
    name: name || source,
    type: 'deep',
  })

export default deepScan
