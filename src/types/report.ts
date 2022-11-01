/* eslint-disable @typescript-eslint/no-namespace, @typescript-eslint/no-explicit-any */
import { Copc, Las } from 'copc'
import { Check } from './check'

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
    mini?: boolean
  }

  type copcError = { message: string; stack?: string }
  type Base = {
    name: string
    checks: Check[]
  }
  type SuccessCopc = Base & {
    scan: Scans.SuccessCopc
    copc?: Copc
  }
  type SuccessLas = Base & {
    scan: Scans.SuccessLas
    las?: {
      header: Las.Header
      vlrs: Las.Vlr[]
    }
    error: copcError //Error //unknown
  }
  type Success = SuccessCopc | SuccessLas
  type Failure = Base & {
    scan: Scans.Failed
    error: copcError //Error //unknown // use Error for the copcError if it's the same as the lasError,
    copcError?: copcError //Error //unknown // otherwise use copcError for copcError and error for lasError
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
