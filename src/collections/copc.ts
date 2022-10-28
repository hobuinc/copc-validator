import { Copc, Getter } from 'copc'
import { copcSuite, headerSuite, vlrSuite, manualHeaderSuite } from 'suites'
import { nodeParser, vlrParser, headerParser, newNodeParser } from 'parsers'
import { Check, manualHeaderParams } from 'types'

type CopcCollection = {
  filepath: string
  copc: Copc
  get: Getter
  deep?: boolean
  maxThreads?: number
}
export const CopcCollection = async ({
  filepath,
  copc,
  get,
  deep = false,
  maxThreads,
}: CopcCollection): Promise<Check.Suite.Collection> => [
  { source: copc, suite: copcSuite },
  headerParser(get, copcHeaderSuite),
  vlrParser(get),
  // nodeParser({ get, copc, filepath, deep, maxThreads }),
  newNodeParser({ get, copc, filepath, deep, maxThreads }),
]

const { legacyPointCount, legacyPointCountByReturn } = manualHeaderSuite
export const copcHeaderSuite: Check.Suite<manualHeaderParams> = {
  legacyPointCount,
  legacyPointCountByReturn,
}
