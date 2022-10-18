import { Copc, Getter, Hierarchy, Point } from 'copc'

export type copcWithGetter = { get: Getter; copc: Copc }
export type baseData = copcWithGetter & { filename: string }
export type nodeScanParams = baseData & {
  deep: boolean
  maxThreads?: number
}
