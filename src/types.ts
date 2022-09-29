import { Copc, Las, Info, Getter } from 'copc'

export declare namespace Check {
  type status = 'pass' | 'fail' | 'warn'
  type Status = {
    status: status
    info?: unknown
  }

  export type Check = Status & {
    id: string
  }

  namespace Function {
    type Sync<T> = (s: T) => Status //| Check[]
    type Async<T> = (s: T) => Promise<Status> //| Promise<Check[]>
  }
  type Function<T> = Function.Sync<T> | Function.Async<T>

  /**
   * Suite: Group of check functions that run on a shared source.
   * Prevents unnecessary repeat Getter fetch calls (http).
   *
   * Usage: Invoke all functions in Suite, wait for Async check functions
   *  to return, then combine all results into a Check array
   */
  export type Suite<T> = Record<string, Function<T>>
}
export type Check = Check.Check

export declare namespace Report {
  namespace Scans {
    type types = 'quick' | 'full' | 'custom'
    type scan = {
      type: types
      result: 'valid' | 'invalid' | 'NA'
      start: Date
      end: Date
    }
    type SuccessCopc = scan & { filetype: 'COPC' }
    type SuccessLas = scan & { filetype: 'LAS' }
    type Failed = scan & { filetype: 'Unknown' }
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
      wkt?: string
      eb?: Las.ExtraBytes[]
    }
  }
  type SuccessLas = Base & {
    scan: Scans.SuccessLas
    las: {
      header: Las.Header
      vlrs: Las.Vlr[]
    }
  }
  type Success = SuccessCopc | SuccessLas
  type Failure = Base & {
    scan: Scans.Failed
    error: Error
  }
  export type Report = Success | Failure
}
export type Report = Report.Report

export const isCopc = (r: Report): r is Report.SuccessCopc =>
  r.scan.filetype === 'COPC'
export const isLas = (r: Report): r is Report.SuccessLas =>
  r.scan.filetype === 'LAS'
export const isFail = (r: Report): r is Report.Failure =>
  r.scan.filetype === 'Unknown'
export const Report = { isCopc, isLas, isFail }
