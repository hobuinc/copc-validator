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

export type Report = {
  name: string
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
