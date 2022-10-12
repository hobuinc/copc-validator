import { CopcSuiteDeep, GetterSuite, LasSuite } from 'checks'
import { generateReport } from 'report'

// Currently the same functions as the Shallow Scan
// TODO: Write Deep Scan checks & omit them from `shallowScan`
export const deepScan = (source: string, name?: string) =>
  generateReport(source, CopcSuiteDeep, LasSuite, GetterSuite, {
    name: name || source,
    type: 'deep',
  })

export default deepScan
