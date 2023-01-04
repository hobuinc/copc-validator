import { Getter, Las } from 'copc'
// import omit from 'lodash.omit'
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
  { source: { header }, suite: headerSuite },
  { source: { header, vlrs }, suite: vlrSuite },
  headerParser({ get, suite: copcHeaderSuite }),
  vlrParser({ get }),
]

// export const LasDirectCollection = async ({
//   get,
//   header,
//   vlrs,
// }: LasCollection): Promise<Check.Suite.Collection> => [
//   {
//     source: { header, vlrs },
//     suite: omit(vlrSuite, ['copc-info', 'copc-hierarchy']),
//   },
//   headerParser({ get }),
// ]
