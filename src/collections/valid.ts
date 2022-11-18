import { Copc, Getter } from 'copc'
import { copcSuite, manualHeaderSuite } from 'suites'
import { nodeParser, vlrParser, headerParser } from 'parsers'
import { Check, manualHeaderParams } from 'types'

type CopcCollection = {
  filepath: string
  copc: Copc
  get: Getter
  deep?: boolean
  workerCount?: number
  showProgress?: boolean
}
/* eslint-disable-next-line */
export const CopcCollection = async ({
  filepath,
  copc,
  get,
  showProgress = false,
  deep = false,
  workerCount,
}: CopcCollection): Promise<Check.Suite.Collection> => [
  { source: copc, suite: copcSuite },
  headerParser(get, copcHeaderSuite),
  vlrParser(get),
  nodeParser({
    get,
    copc,
    filepath,
    deep,
    workerCount,
    showProgress,
  }),
]

const { legacyPointCount, legacyPointCountByReturn } = manualHeaderSuite
export const copcHeaderSuite: Check.Suite<manualHeaderParams> = {
  legacyPointCount,
  legacyPointCountByReturn,
}
