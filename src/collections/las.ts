import { Getter, Las } from 'copc'
import { headerParser, vlrParser } from '../parsers/index.js'
import { headerSuite, vlrSuite } from '../suites/index.js'
import { Check } from '../types/index.js'
import { copcHeaderSuite } from './valid.js'

type LasCollection = { get: Getter; header: Las.Header; vlrs: Las.Vlr[] }
export const LasCopcCollection = async ({
  get,
  header,
  vlrs,
}: LasCollection): Promise<Check.Suite.Collection> => [
  { source: header, suite: headerSuite },
  { source: { header, vlrs }, suite: vlrSuite },
  headerParser({ get, suite: copcHeaderSuite }),
  vlrParser({ get }),
]
