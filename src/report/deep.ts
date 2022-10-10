import { CopcSuite, GetterSuite, LasSuite } from '../checks'
import { generateReport } from '.'

// Currently the same functions as the Shallow Scan
// TODO: Write Deep Scan checks & omit them from `shallowScan`
export const deepScan = (source: string, name?: string) =>
  generateReport(source, CopcSuite, LasSuite, GetterSuite, {
    name: name || source,
    type: 'deep',
  })

export default deepScan
