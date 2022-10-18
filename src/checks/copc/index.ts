import { Check } from 'types'
import headerSuite from 'checks/las/header'
import vlrSuite from 'checks/las/vlrs'
import { Copc, Getter } from 'copc'
import { copcHeaderSourcer } from '../getter'
import nodeScanSourcer from './nodes'

export const CopcCollection = async (
  filename: string,
  get: Getter,
  copc: Copc,
  deep: boolean = false,
  maxThreads?: number,
): Promise<Check.Suite.Collection> => [
  { source: copc.header, suite: headerSuite },
  { source: copc, suite: vlrSuite },
  copcHeaderSourcer(get),
  nodeScanSourcer(get, copc, filename, deep, maxThreads),
]

export default CopcCollection
