import { Binary, Copc, Getter, Las } from 'copc'
import type { enhancedNodeMap } from './nodes'

export type manualHeaderParams = { buffer: Binary; dv: DataView }
export type manualVlrParams = { get: Getter; vlrs: Las.Vlr[] }
export type pointDataParams = { copc: Copc; nodeMap: enhancedNodeMap }
