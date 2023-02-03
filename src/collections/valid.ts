import { Copc, Getter } from 'copc'
import { copcSuite, manualHeaderSuite } from '../suites/index.js'
import { nodeParser, vlrParser, headerParser } from '../parsers/index.js'
import { Check, manualHeaderParams } from '../types/index.js'

type CopcCollection = {
  file: string | File
  copc: Copc
  get: Getter
  deep?: boolean
  workerCount?: number
  queueLimit?: number
  sampleSize?: number
  showProgress?: boolean
}
/* eslint-disable-next-line */
export const CopcCollection = async ({
  file,
  copc,
  get,
  showProgress = false,
  deep = false,
  workerCount,
  queueLimit,
  sampleSize,
}: CopcCollection): Promise<Check.Suite.Collection> => [
  { source: copc, suite: copcSuite },
  headerParser({ get, suite: copcHeaderSuite }),
  vlrParser({ get }),
  nodeParser({
    get,
    copc,
    file,
    deep,
    workerCount,
    queueLimit,
    showProgress,
    sampleSize,
  }),
]

const { legacyPointCount, legacyPointCountByReturn } = manualHeaderSuite
export const copcHeaderSuite: Check.Suite<manualHeaderParams> = {
  legacyPointCount,
  legacyPointCountByReturn,
}
