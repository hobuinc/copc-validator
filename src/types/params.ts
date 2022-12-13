import type { Binary, Getter, Las } from 'copc'

// suites
export type manualHeaderParams = { buffer: Binary; dv: DataView }
export type manualVlrParams = { get: Getter; vlrs: Las.Vlr[] }

// parsers
