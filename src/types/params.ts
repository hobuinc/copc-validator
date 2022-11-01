import { Binary, Getter, Las } from 'copc'
import { Report } from './report'

export type generateReportParams = {
  source: string
  options: Report.Options
}

// suites
export type manualHeaderParams = { buffer: Binary; dv: DataView }
export type manualVlrParams = { get: Getter; vlrs: Las.Vlr[] }
// export type pointDataParams = { copc: Copc; nodeMap: enhancedNodeMap }
