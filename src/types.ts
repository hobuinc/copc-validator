import { Copc, Las, Info, Getter } from 'copc'

export declare namespace Check {
  type status = 'pass' | 'fail' | 'warn'
  type StatusObj = {
    status: status
    info?: any //string
  }

  export type SyncFunction<T> =
    | ((c: T) => boolean)
    | ((c: T) => StatusObj)
    | ((c: T) => boolean | StatusObj)
  export type SyncGroup<T = Copc> = {
    [id: string]: SyncFunction<T>
  }

  export type Groups<T = Copc> = {
    [name: string]: SyncGroup<T>
  }

  export type AsyncFunction<T> =
    | ((c: T) => Promise<boolean>)
    | ((c: T) => Promise<Check.StatusObj>)
    | ((c: T) => Promise<boolean | Check.StatusObj>)
  export type AsyncGroup<T> = {
    [id: string]: AsyncFunction<T>
  }

  export type MixedFunction<T> = SyncFunction<T> | AsyncFunction<T>

  export type MixedGroup<S, A> = SyncGroup<S> | AsyncGroup<A>

  export type MixedGroups<S, A> = {
    [name: string]: MixedGroup<S, A>
  }

  export type Check = StatusObj & {
    id: string
  }
}
export type Check = Check.Check

// const isAsyncFunction = <T>(
//   f: Check.MixedFunction<T>,
// ): f is Check.AsyncFunction<T> => f.constructor.name === 'AsyncFunction'
// export const isAsyncGroup = <T>(
//   g: Check.MixedGroup<any, T>,
// ): g is Check.AsyncGroup<T> => isAsyncFunction<T>(Object.values(g)[0])

// export const Check = { isAsyncGroup }

export declare namespace Report {
  namespace Scans {
    type types = 'quick' | 'full' | 'custom'
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
      wkt?: string
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
  r.scan.result === 'COPC'
export const isLas = (r: Report): r is Report.SuccessLas =>
  r.scan.result === 'LAS'
export const isFail = (r: Report): r is Report.Failure =>
  r.scan.result === 'Unknown'
export const Report = { isCopc, isLas, isFail }
