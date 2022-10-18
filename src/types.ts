import { Copc, Las, Info, Getter } from 'copc'

export declare namespace Check {
  type status = 'pass' | 'fail' | 'warn'
  type Status = {
    status: status
    info?: string
  }

  namespace Function {
    type Sync<T> = (s: T) => Check.Status
    /* DEPRECATED
    type Async<T> = (s: T) => Promise<Check.Status>
    type NestedSuite<T> = (s: T) => Promise<Check[]> */
  }
  // Syncronous check function
  export type Function<T> = Function.Sync<T> // | Function.Async<T> | Function.NestedSuite<T>

  namespace Suite {
    // The actual object type that gets used by invokeCollection
    export type withSource<T> = { source: T; suite: Suite<T> }
    // Nested Suites have been replaced with any function that returns the following
    export type Nested<T> = Promise<withSource<T>>
    // Top-Level Suites (Copc, Las, Getter) have been replaced with Collections
    export type Collection = (withSource<any> | Nested<any>)[]
    // a.k.a Arrays of Suite.withSource<any> (or Promises)
  }
  // Suite: Record of Syncronous Functions that all run on the same `source`, and
  // each return a `Check.Status` object. The `id` of a Function in a Suite is the
  // `id` that should be assigned to turn the `Check.Status` into a `Check.Check`
  export type Suite<T> = { [id: string]: Function<T> }

  // Terminology - `Sourcer`: An Asyncronous Function that returns a `Suite.Nested`
  // object. Replaces `Function.NestedSuite` to simplify Suites and should be more
  // performant with PromisePools
  // TODO: Handle `Sourcer` errors more gracefully

  export type Check = Status & {
    id: string
  }
}
export type Check = Check.Check

export declare namespace Report {
  namespace Scans {
    type types = 'shallow' | 'deep' | 'custom'
    type scan = {
      type: types
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
