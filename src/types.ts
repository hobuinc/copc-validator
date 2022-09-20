import { Copc, Las, Info } from 'copc'

export declare namespace Check {
  type status = 'pass' | 'fail' | 'warn'
  type StatusObj = {
    status: status
    info?: any //string
  }

  export type Function<T = Copc> =
    | ((c: T) => boolean)
    | ((c: T) => StatusObj)
    | ((c: T) => boolean | StatusObj)

  export type Group<T = Copc> = {
    [id: string]: Function<T>
  }
  export type Groups<T = Copc> = {
    [name: string]: Group<T>
  }

  export type Check = StatusObj & {
    id: string
  }
}
export type Check = Check.Check

export declare namespace Report {
  namespace Scans {
    type types = 'quick' | 'full' | 'custom'
    type results = 'COPC' | 'LAS' | 'Unknown' //Not yet implemented: | 'LAZ'
    type scan = {
      type: types
      start: Date
      end: Date
    }
    type SuccessCopc = scan & { result: 'COPC' }
    type SuccessLas = scan & { result: 'LAS' }
    type Failed = scan & { result: 'Unknown' }
  }
  export type Options = {
    name: string
    type: Scans.types
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
  type SuccessLas = Base & {
    scan: Scans.SuccessLas
    las: {
      header: Las.Header
      vlrs: Las.Vlr[]
    }
  }
  type Failed = Base & {
    scan: Scans.Failed
    error: Error
  }
  export type Report = SuccessCopc | SuccessLas | Failed
}
export type Report = Report.Report

export const isCopc = (r: Report): r is Report.SuccessCopc =>
  r.scan.result === 'COPC'
export const isLas = (r: Report): r is Report.SuccessLas =>
  r.scan.result === 'LAS'
export const isFail = (r: Report): r is Report.Failed =>
  r.scan.result === 'Unknown'
export const Report = { isCopc, isLas, isFail }
