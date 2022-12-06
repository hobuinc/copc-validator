import { Binary, Getter, Las } from 'copc'
import { manualHeaderSuite as Suite } from '../suites/index.js'
import type { Check, manualHeaderParams } from '../types/index.js'

type headerParserParams = {
  get: Getter
  suite?: Check.Suite<manualHeaderParams>
}

export const headerParser: Check.Parser<
  headerParserParams,
  manualHeaderParams
> = async ({ get, suite = Suite }) => {
  const buffer = await get(0, Las.Constants.minHeaderLength)
  const dv = Binary.toDataView(buffer)
  if (buffer.byteLength < Las.Constants.minHeaderLength)
    throw new Error(
      `Invalid header: must be at least ${Las.Constants.minHeaderLength} bytes`,
    )
  return { source: { buffer, dv }, suite }
}
