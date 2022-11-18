import { Getter, Las } from 'copc'
import { headerParser, vlrParser } from 'parsers'
import { headerSuite, vlrSuite } from 'suites'
import { Check } from 'types'
import { copcHeaderSuite } from './valid'

type LasCollection = { get: Getter; header: Las.Header; vlrs: Las.Vlr[] }
export const LasCopcCollection = async ({
  get,
  header,
  vlrs,
}: LasCollection): Promise<Check.Suite.Collection> => [
  { source: header, suite: headerSuite },
  { source: { header, vlrs }, suite: vlrSuite },
  headerParser(get, copcHeaderSuite),
  vlrParser(get),
]
