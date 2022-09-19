import { Copc, Las, Info } from 'copc'

export declare namespace Check {
  type status = 'pass' | 'fail' | 'warn'
  type StatusObj = {
    status: status
    info?: string
  }

  export type Function =
    | ((c: Copc) => boolean)
    | ((c: Copc) => StatusObj)
    | ((c: Copc) => boolean | StatusObj)

  export type Group = {
    [id: string]: Function
  }
  export type Groups = {
    [name: string]: Group
  }

  export type Check = StatusObj & {
    id: string
  }
}
export type Check = Check.Check

export const isCopc = (r: Report): r is Report.SuccessCopc =>
  r.scan.result === 'COPC'
export const isFail = (r: Report): r is Report.Failed =>
  r.scan.result === 'Unknown'

export declare namespace Report {
  namespace Scans {
    type types = 'quick' | 'full' | 'custom'
    type results = 'COPC' | 'Unknown' //Not yet implemented: | 'LAZ' | 'LAS'
    type scan = {
      type: types
      start: Date
      end: Date
    }
    type SuccessCopc = scan & { result: 'COPC' }
    type Failed = scan & { result: 'Unknown' }
  }
  type Base = {
    name: string
    checks: Check[]
  }
  type SuccessCopc = Base & {
    scan: Scans.SuccessCopc
    copc: {
      header: Las.Header
      vlrs: Las.Vlr[]
      info: Info
    }
  }
  type Failed = Base & {
    scan: Scans.Failed
    error: Error
  }
  export type Report = SuccessCopc | Failed
}
export type Report = Report.Report
export const Report = { isCopc, isFail }
