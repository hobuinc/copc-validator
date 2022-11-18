import { Binary, Getter, Las } from 'copc'
import { headerParser, vlrParser } from '../parsers/index.js'
import { headerSuite, vlrSuite } from '../suites/index.js'
import { Check } from '../types/index.js'
import { getterToHeader } from '../utils/index.js'

export const FallbackCollection = async (
  get: Getter,
): Promise<Check.Suite.Collection> => {
  const { buffer, info } = await getterToHeader(get)
  return [headerFallback({ get, buffer }), vlrFallback({ get, info })]
}

type headerFallback = { get: Getter; buffer: Binary }
const headerFallback = async ({ get, buffer }: headerFallback) => {
  try {
    const header = Las.Header.parse(buffer)
    return {
      source: header,
      suite: headerSuite,
    }
  } catch (error) {
    return headerParser(get)
  }
}

type vlrFallback = { get: Getter; info: Las.Vlr.OffsetInfo }
const vlrFallback = async ({ get, info }: vlrFallback) => {
  try {
    const header = info //|| (await getterToHeader(get)).info
    const vlrs = await Las.Vlr.walk(get, header)
    return { source: { header, vlrs }, suite: vlrSuite }
  } catch (error) {
    return vlrParser(get)
  }
}
