import { Binary, Getter, Las } from 'copc'
import { Check } from '../types/index.js'
import {
  basicCheck,
  vlrCheck,
  Statuses,
  checkVlrDuplicates,
} from '../utils/index.js'
import proj4 from '@landrush/proj4'

export type vlrSuiteParams = { header: Las.Vlr.OffsetInfo; vlrs: Las.Vlr[] }
/**
 * Suite of Check Function for checking the VLRs retrieved by `Copc.create` or
 * `Las.Vlr.walk`. Also requires the `Las.Vlr.OffsetInfo` from `copc.header` to
 * confirm `vlrCount` and `evlrCount`. Used in the Copc Suite and the Las and
 * Fallback Collections, in case `Las.Vlr.walk` succeeds after `Copc.create` fails
 */
export const vlrSuite: Check.Suite<vlrSuiteParams> = {
  vlrCount: {
    function: ({ header: { vlrCount }, vlrs }) =>
      basicCheck(vlrs.filter((v) => !v.isExtended).length, vlrCount),
    description: 'Number of VLRs found matches VLR Count in Header',
  },
  evlrCount: {
    function: ({ header: { evlrCount }, vlrs }) =>
      basicCheck(vlrs.filter((v) => v.isExtended).length, evlrCount),
    description: 'Number of EVLRs found matches EVLR Count in Header',
  },
  'copc-info': {
    function: ({ vlrs }) =>
      vlrCheck({
        vlrs,
        userId: 'copc',
        recordId: 1,
        required: true,
        finalCheck: (v) =>
          !v.isExtended && v.contentLength === 160 && v.contentOffset === 429,
      }),
    description: 'Exactly one (1) copc info VLR exists as the first VLR',
  },
  'copc-hierarchy': {
    function: ({ vlrs }) => vlrCheck({ vlrs, userId: 'copc', recordId: 1000 }),
    description: 'At least one (1) copc hierarchy (E)VLR exists',
  },
  'laszip-encoded': {
    function: ({ vlrs }) =>
      vlrCheck({
        vlrs,
        userId: 'laszip encoded',
        recordId: 22204,
        required: true,
        finalCheck: (v) => !v.isExtended,
      }),
    description: 'At least one (1) laszip compression VLR exists',
  },
}

export const manualVlrSuite: Check.Suite<{ get: Getter; vlrs: Las.Vlr[] }> = {
  wkt: {
    function: async ({ get, vlrs }) => {
      const vlr = Las.Vlr.find(vlrs, 'LASF_Projection', 2112)
      if (!vlr) return Statuses.failureWithInfo(`Failed to find WKT SRS VLR`)
      if (checkVlrDuplicates(vlrs, 'LASF_Projection', 2112))
        return Statuses.failureWithInfo('Found multiple WKT SRS VLRs')
      const wkt = Binary.toCString(await Las.Vlr.fetch(get, vlr))
      const status = (() => {
        try {
          /*const p = */ proj4(wkt)
          return Statuses.success
        } catch (error) {
          return Statuses.failureWithInfo(
            `Unable to initialize proj4 with WKT string`,
          )
        }
      })()
      return status
    },
    description: 'WKT VLR (string) exists and successfully initializes proj4js',
  },
  laz: {
    function: async ({ get, vlrs }) => {
      const vlr = Las.Vlr.find(vlrs, 'laszip encoded', 22204)
      if (!vlr) return Statuses.failureWithInfo(`Failed to find LAZ VLR`)
      if (checkVlrDuplicates(vlrs, 'laszip encoded', 22204))
        return Statuses.failureWithInfo('Found multiple LAZ VLRs')
      
      const lazVlr = Binary.toDataView(await Las.Vlr.fetch(get, vlr))
      const status = (() => {
        try {
          checkLazVlr(lazVlr)
          return Statuses.success
        } catch (error: any) {
          return Statuses.failureWithInfo(`Failed to parse LAZ VLR: ${error.message}`)
        }
      })()
      return status
    },
    description: 'LAZ VLR exists and contains valid data fields',
  },
  "copc-info": {
    function: async ({ get, vlrs }) => {
      const vlr = Las.Vlr.find(vlrs, 'copc', 1)
      // these checks are done in vlrSuite already
      if (!vlr) return Statuses.failureWithInfo(`Failed to find copc-info VLR`)
      if (checkVlrDuplicates(vlrs, 'copc', 1))
        return Statuses.failureWithInfo('Found multiple copc-info VLRs')
      const copcInfoVlr = Binary.toDataView(await Las.Vlr.fetch(get, vlr))
      const status = (() => {
        try {
          checkCopcInfoVlr(copcInfoVlr)
          return Statuses.success
        } catch (error: any) {
          return Statuses.failureWithInfo(`Failed to parse copc-info VLR: ${error.message}`)
        }
      })()
      return status
    },
    description: 'COPC info VLR exists and contains valid data fields',
  }
}

function checkLazVlr(data: DataView) {
  const UINT32_MAX = 0xFFFFFFFF
  // only checking the chunk size & coder for now.
  const coder = data.getUint16(2, true)
  if (coder != 0) throw new Error(`Coder must be 0; found ${coder}`)
  const chunkSize = data.getUint32(12, true)
  if (chunkSize != UINT32_MAX)
    throw new Error(`Chunk size must equal UINT32_MAX (${UINT32_MAX}); found ${chunkSize}`)
}

function checkCopcInfoVlr(data: DataView) {
  for (let i = 0; i < 11; i++) {
    const val = data.getBigUint64(72 + 8 * i, true)
    if (val) throw new Error(`COPC field reserved [${i}] must be 0; found ${val}`)
  }
}
