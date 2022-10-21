import { Copc, Getter } from 'copc'
import { headerSuite, vlrSuite, manualHeaderSuite } from 'suites'
import { nodeParser, vlrParser, headerParser } from 'parsers'
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
  { source: copc.header, suite: headerSuite },
  { source: copc, suite: vlrSuite },
  headerParser(get, copcHeaderSuite),
  vlrParser(get),
  nodeParser({ get, copc, filepath, deep, maxThreads }),
]

// export default CopcCollection

const { legacyPointCount, legacyPointCountByReturn } = manualHeaderSuite
export const copcHeaderSuite: Check.Suite<manualHeaderParams> = {
  legacyPointCount,
  legacyPointCountByReturn,
}
