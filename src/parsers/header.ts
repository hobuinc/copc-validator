import { Binary, Getter, Las } from 'copc'
import { manualHeaderSuite as Suite } from '../suites/index.js'
import type { Check, manualHeaderParams } from '../types/index.js'

export const headerParser = async (
  get: Getter,
  suite: Check.Suite<manualHeaderParams> = Suite,
): Check.Suite.Nested<manualHeaderParams> => {
  const buffer = await get(0, Las.Constants.minHeaderLength)
  const dv = Binary.toDataView(buffer)
  if (buffer.byteLength < Las.Constants.minHeaderLength)
    throw new Error(
      `Invalid header: must be at least ${Las.Constants.minHeaderLength} bytes`,
    )
  return { source: { buffer, dv }, suite }
}
