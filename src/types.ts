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

  export type Check = {
    id: string
    // name: string
    status: status
    info?: any
  }
}
export type Check = Check.Check

export type Report = {
  file: string
  scan: {
    type: 'quick' | 'full'
    start: Date
    end: Date
  }
  header: Las.Header
  vlrs: Las.Vlr[]
  info: Info
  checks: Check.Check[]
}
