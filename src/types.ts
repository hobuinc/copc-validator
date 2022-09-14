import { Copc, Las, Info } from 'copc'

export declare namespace Unions {
  type status = 'pass' | 'fail' | 'warn'
  type type = 'quick' | 'full'
}

export type StatusWithInfo = {
  status: Unions.status
  info?: any
}

export type Check = {
  id: number | string
  name: string
  status: Unions.status
  info?: any
}

export type Report = {
  file: string
  scan: {
    type: Unions.type
    start: Date
    end: Date
  }
  header: Las.Header
  vlrs: Las.Vlr[]
  info: Info
  checks: Check[]
}
