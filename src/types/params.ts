import type { Binary, Copc, Getter, Las } from 'copc'
import { Report } from './report'

export type generateReportParams = {
  source: string
  options: Report.Options
}

// suites
export type manualHeaderParams = { buffer: Binary; dv: DataView }
export type manualVlrParams = { get: Getter; vlrs: Las.Vlr[] }

// parsers
export type nodeParserParams = {
  get: Getter
  copc: Copc
  filepath: string
  deep?: boolean
  workerCount?: number
  showProgress?: boolean
}
