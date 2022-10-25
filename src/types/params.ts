import { Binary, Copc, Getter, Las } from 'copc'
import { Report } from './report'
import type { enhancedNodeMap } from './nodes'
import { Check } from './check'

export type generateReportParams = {
  source: string
  options: Report.Options
  // collections: {
  //   copcCollection?: Check.CollectionFn
  //   lasCollection?: Check.CollectionFn
  //   fallbackCollection?: Check.CollectionFn
  // }
}

// suites
export type manualHeaderParams = { buffer: Binary; dv: DataView }
export type manualVlrParams = { get: Getter; vlrs: Las.Vlr[] }
export type pointDataParams = { copc: Copc; nodeMap: enhancedNodeMap }
