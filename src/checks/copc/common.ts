import { Copc, Getter, Hierarchy, Point } from 'copc'

export type copcWithGetter = { get: Getter; copc: Copc }
export type nodeScanParams = copcWithGetter & { deep: boolean }
