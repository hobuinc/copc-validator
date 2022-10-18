import { Check, Pool } from 'types'
import header from './header'
import vlrSuite from 'checks/las/vlrs'
import { Copc, Getter } from 'copc'
import { invokeAllChecks } from 'checks'
// reads copcHeaderSuite as {} if imported from 'checks'
import { copcHeaderSuite } from '../getter'
import nodeScanSuite /*, { nodeScanPool }*/ from './nodes'
import { baseData, copcWithGetter } from './common'

const copcSuite: Check.Suite<Copc> = { ...header, ...vlrSuite }
const getterSuite: Check.Suite<Getter> = { ...copcHeaderSuite }

export const CopcSuite = (
  deep: boolean = false,
): Check.Suite<baseData & { maxThreads?: number }> => ({
  suites: async ({ get, copc, filename, maxThreads }) =>
    invokeAllChecks([
      { source: copc, suite: copcSuite },
      { source: get, suite: getterSuite },
      {
        source: { get, copc, deep, filename, maxThreads },
        suite: nodeScanSuite,
      },
    ]),
})

// export const CopcCollection = (
//   get: Getter,
//   copc: Copc,
//   deep: boolean = false,
// ): Pool.Suite.Collection => [
//   {
//     source: copc,
//     nest: async (copc: Copc) => [
//       { source: copc, suite: copcSuite } as Pool.Suite.withSource<Copc>,
//     ],
//   },
//   {
//     source: get,
//     nest: async (get: Getter) => [
//       { source: get, suite: getterSuite } as Pool.Suite.withSource<Getter>,
//     ],
//   },
//   {
//     source: { get, copc, deep },
//     nest: nodeScanPool,
//   },
// ]

// export const CopcPool: Pool.Suite.Nested = async (
//   get: Getter,
//   copc: Copc,
//   deep: boolean = false,
// ) =>
//   [
//     { source: copc, suite: copcSuite },
//     { source: get, suite: getterSuite },
//     ...(await nodeScanPool(get, copc, deep)),
//   ] as Pool.Suite.withSource<any>[]
// type CopcSuiteParams = { get: Getter; copc: Copc; deep: boolean }
// export const CopcSuite_new = async ({
//   get,
//   copc,
//   deep = false,
// }: CopcSuiteParams) =>
//   [
//     { source: copc, suite: copcSuite },
//     { source: get, suite: getterSuite },
//     //{ source: { get, copc, deep }, suite: nodeScanSuite },
//     ...(await nodeScanSuite_new({ get, copc, deep })),
//   ] as Check.CopcSuites
// export const CopcSuite_new =
//   (deep: boolean = false): Check.NestedSuite_new =>
//   ({ get, copc }: copcWithGetter) =>
//     [
//       { source: copc, suite: copcSuite },
//       { source: get, suite: getterSuite },
//       { source: { get, copc, deep }, suite: nodeScanSuite },
//     ] as Check.SuiteWithSource_new<any>[]

export default CopcSuite
