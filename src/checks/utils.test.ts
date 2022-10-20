import { Copc, Getter } from 'copc'
import { ellipsoidFiles, getCopcItems } from 'test'
import { complexCheck } from './utils'

const get = Getter.create(ellipsoidFiles.copc)

test('complexCheck()', async () => {
  const { copc } = await getCopcItems()
  const successInfo =
    'Changed info type to string, so must change these variables'
  const undefinedInfo = undefined
  const stringInfo = 'This is a string'
  const failureInfo = 'This too must be a string: new Error()'
  const successWithInfo = complexCheck({
    source: copc.header.pointDataRecordFormat,
    checker: [6, 7, 8],
    warning: false,
    infoOnFailure: undefined,
    infoOnSuccess: successInfo,
  })
  const warning = complexCheck({
    source: copc.header.minorVersion,
    checker: 3,
    warning: true,
    infoOnFailure: undefinedInfo,
  })
  const warningWithInfo = complexCheck({
    source: copc.header.minorVersion,
    checker: 3,
    warning: true,
    infoOnFailure: stringInfo,
  })
  const failure = complexCheck({ source: copc.header.minorVersion, checker: 3 })
  const failureWithInfo = complexCheck({
    source: copc.header.minorVersion,
    checker: 3,
    warning: false,
    infoOnFailure: failureInfo,
    infoOnSuccess: stringInfo,
  })

  expect(successWithInfo.info).toEqual(successInfo)
  expect(warning.info).toEqual('No information provided')
  expect(warningWithInfo.info).toEqual(stringInfo)
  expect(failure.info).toBeUndefined()
  expect(failureWithInfo.info).toEqual(failureInfo)
})
