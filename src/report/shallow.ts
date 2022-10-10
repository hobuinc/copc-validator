import { CopcSuite, GetterSuite, LasSuite } from '../checks'
import { generateReport } from '.'

export const shallowScan = (source: string, name?: string) =>
  generateReport(source, CopcSuite, LasSuite, GetterSuite, {
    name: name || source,
    type: 'shallow',
  })

export default shallowScan
