import { Copc, Las, Info, Getter } from 'copc'

export declare namespace Check {
  type status = 'pass' | 'fail' | 'warn'
  type Status = {
    status: status
    info?: unknown
  }

  namespace Function {
    type Sync<T> = (s: T) => Check.Status
    type Async<T> = (s: T) => Promise<Check.Status>
    type NestedSuite<T> = (s: T) => Promise<Check[]>
  }
  export type Function<T> =
    | Function.Sync<T>
    | Function.Async<T>
    | Function.NestedSuite<T>

  /**
   * Suite: Group of check functions that run on a shared source.
   * Prevents unnecessary repeat Getter fetch calls (http).
   *
   * Usage: Invoke all functions in Suite, wait for Async check functions
   *  to return, then combine all results into a Check array
   */
  export type Suite<T> = Record<string, Function<T>>

  export type Check = Status & {
    id: string
  }
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
      time: number
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
    copc: Copc
    // copc: {
    //   header: Las.Header
    //   vlrs: Las.Vlr[]
    //   info: Info
    //   wkt?: string
    //   eb?: Las.ExtraBytes[]
    // }
  }
  type SuccessLas = Base & {
    scan: Scans.SuccessLas
    las: {
      header: Las.Header
      vlrs: Las.Vlr[]
    }
    copcError: Error
  }
  type Success = SuccessCopc | SuccessLas
  type Failure = Base & {
    scan: Scans.Failed
    error: Error // use Error for the copcError if it's the same as the lasError,
    copcError?: Error // otherwise use copcError for copcError and error for lasError
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
