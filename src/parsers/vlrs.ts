import { Getter } from 'copc'
import { Check, manualVlrParams } from 'types'
import { manualVlrSuite as Suite } from 'suites'
import { getterToHeader, doWalk } from 'utils'

export const vlrParser = async (
  get: Getter,
  suite: Check.Suite<manualVlrParams> = Suite,
): Check.Suite.Nested<manualVlrParams> => {
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
