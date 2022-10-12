import { Copc, Getter } from 'copc'
import { ellipsoidFiles, getCopcItems } from 'test'
import { complexCheck, removeVlr, checkVlrDuplicates } from './utils'
// import { removeVlr, checkVlrDuplicates } from './vlrs'

const get = Getter.create(ellipsoidFiles.copc)

test('complexCheck()', async () => {
  const { copc } = await getCopcItems()
  const successInfo =
    'Changed info type to string, so must change these variables'
  const undefinedInfo = undefined // this should be fine
  const stringInfo = 'This is a string'
  const failureInfo = 'This too must be a string: new Error()'
  const successWithInfo = complexCheck(
    copc.header.pointDataRecordFormat,
    [6, 7, 8],
    false,
    undefined,
    successInfo,
  )
  const warning = complexCheck(copc.header.minorVersion, 3, true, undefinedInfo)
  const warningWithInfo = complexCheck(
    copc.header.minorVersion,
    3,
    true,
    stringInfo,
  )
  const failure = complexCheck(copc.header.minorVersion, 3)
  const failureWithInfo = complexCheck(
    copc.header.minorVersion,
    3,
    false,
    failureInfo,
    stringInfo,
  )

  expect(successWithInfo.info).toEqual(successInfo)
  expect(warning.info).toEqual('No information provided')
  expect(warningWithInfo.info).toEqual(stringInfo)
  expect(failure.info).toBeUndefined()
  expect(failureWithInfo.info).toEqual(failureInfo)
})

test('vlrs utilities', async () => {
  const { vlrs } = await Copc.create(get)
  const vlrsMinusCopcInfo = removeVlr(vlrs, 'copc', 1)
  expect(vlrsMinusCopcInfo).not.toContainEqual({
    userId: 'copc',
    recordId: 1,
    contentOffset: 429,
    contentLength: 160,
    description: 'COPC info VLR',
    isExtended: false,
  })
  expect(vlrsMinusCopcInfo).toContainEqual({
    userId: 'copc',
    recordId: 1000,
    contentOffset: 1184242,
    contentLength: 160,
    description: 'EPT Hierarchy',
    isExtended: true,
  })
  expect(checkVlrDuplicates(vlrs, 'copc', 1)).toBe(false)
  const vlrsPlusDupedCopcInfo = [
    ...vlrs,
    {
      userId: 'copc',
      recordId: 1,
      contentOffset: 429,
      contentLength: 160,
      description: 'COPC info VLR',
      isExtended: false,
    },
  ]
  expect(checkVlrDuplicates(vlrsPlusDupedCopcInfo, 'copc', 1)).toBe(true)
})
