import { Getter } from 'copc'
import { Check, manualVlrParams } from '../types/index.js'
import { manualVlrSuite as Suite } from '../suites/index.js'
import { getterToHeader, doWalk } from '../utils/index.js'

type vlrParserParams = { get: Getter; suite?: Check.Suite<manualVlrParams> }

export const vlrParser: Check.Parser<
  vlrParserParams,
  manualVlrParams
> = async ({ get, suite = Suite }) => {
  const { info } = await getterToHeader(get)
  const vlrs = await doWalk({
    get,
    startOffset: info.headerLength,
    count: info.vlrCount,
    isExtended: false,
  })
  const evlrs = await doWalk({
    get,
    startOffset: info.evlrOffset,
    count: info.evlrCount,
    isExtended: true,
  })
  return { source: { get, vlrs: [...vlrs, ...evlrs] }, suite }
}
// TODO: Parse without doWalk (to avoid Copc.create() errors)?
