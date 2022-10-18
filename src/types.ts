import { Copc, Las, Info, Getter } from 'copc'

export declare namespace Check {
  type status = 'pass' | 'fail' | 'warn'
  type Status = {
    status: status
    info?: string
  }

  namespace Function {
    type Sync<T> = (s: T) => Check.Status
    type Async<T> = (s: T) => Promise<Check.Status>
    type NestedSuite<T> = (s: T) => Promise<Check[]>
    // enables suite (s: T) => {T->S, return invokeAllChecks({source: S, suite})}
    // but this structure becomes useless (I think) if we want to use a promise pool
    // so I need to restructure Nested Suites to be able to see each check function
    // individually, then I can call them in a promise pool with the same source
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
  export type Suite<T> = { [id: string]: Function<T> }
  export type SuiteWithSource<T> = { source: T; suite: Suite<T> }

  export type Check = Status & {
    id: string
  }
}
export type Check = Check.Check

// export type CopcSuites = [
//   { source: Copc; suite: Suite<Copc> },
//   { source: Getter; suite: Suite<Getter> },
//   { source: copcSuiteParams; suite: Suite<copcSuiteParams> },
// ]

// Currently, all plain Check.Suites are actually fully syncronous, and all
// NestedSuites are asyncronous. I should be able to simplify things off that fact,
// but I believe the way that Suites are invoked needs to be drastically changed.

// I could simplify by requiring NestedSuites to use the Getter directly as the
// only parameter (plus deep where required), but I'm not sure if that would actually
// solve the problem(s)

// I think separating NestedSuites from Suites (by taking it out of Check.Function)
// and turning it into its own Asyncronous Function type is the way to go
export declare namespace Pool {
  namespace Suite {
    type withSource<T> = { source: T; suite: Suite<T> }
    namespace Nested {
      type Sync = (...s: any[]) => withSource<any>[]
      type Async = (source: any) => Promise<withSource<any>[]>
    }
    type Nested = Nested.Async //| Nested.Sync
    type Collection = {
      source: any
      nest: Nested
    }[]
  }
  export type Suite<T> = {
    [id: string]: Check.Function.Sync<T> //| Check.Function.Async<T>
  }
}

export declare namespace Report {
  namespace Scans {
    type types = 'shallow' | 'deep' | 'custom'
    type scan = {
      type: types
      //result: 'valid' | 'invalid' | 'NA'
      start: Date
      end: Date
      time: number
    }
    type SuccessCopc = scan & { filetype: 'COPC' }
    type SuccessLas = scan & { filetype: 'LAS' }
    type Failed = scan & { filetype: 'Unknown' }
  }
  export type Options = {
    name?: string
    deep?: boolean
    maxThreads?: number
  }
  export type old_Options = {
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
