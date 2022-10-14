import { Binary, Getter, Las } from 'copc'
import { getLasItems, ellipsoidFiles } from 'test'
import {
  invokeAllChecks,
  getterToHeader,
  splitChecks,
  getCheckIds,
} from 'checks'
import headerSuite, {
  formatGuid,
  parsePoint,
  manualHeaderParse,
  manualHeaderSuite,
} from './header'
import lasHeaderSuite from 'checks/las/header'
import { difference } from 'lodash'

const get = Getter.create(ellipsoidFiles.laz14)
const fakeGet = Getter.create(ellipsoidFiles.fake)
const badGet = Getter.create(ellipsoidFiles.badCopc)
const thisGet = Getter.create(__filename)

test('getter header all-expected', async () => {
  const { buffer, dv } = await getterToHeader(get)
  const checks = await invokeAllChecks({
    source: { get, buffer, dv },
    suite: headerSuite,
  })
  const { header } = await getLasItems()
  expect(checks).toEqual(
    await invokeAllChecks({ source: header, suite: lasHeaderSuite }),
  )
})

test('getter header fake-copc', async () => {
  const { buffer, dv } = await getterToHeader(fakeGet)
  const checks = await invokeAllChecks({
    source: { get: fakeGet, buffer, dv },
    suite: headerSuite,
  })

  expect(checks).toEqual([
    {
      id: 'manualHeaderParse',
      info: 'Invalid header: must be at least 375 bytes',
      status: 'fail',
    },
  ])
})

test('getter header failure', async () => {
  const { buffer, dv } = await getterToHeader(thisGet)
  const checks = await invokeAllChecks({
    source: { get: thisGet, buffer, dv },
    suite: headerSuite,
  })

  checks.forEach((check) => expect(check).not.toHaveProperty('status', 'pass'))
})

test('manualHeaderSuite null-data', async () => {
  const buffer = new Uint8Array(Las.Constants.minHeaderLength)
  const dv = Binary.toDataView(buffer)
  const checks = await invokeAllChecks({
    source: { buffer, dv },
    suite: manualHeaderSuite,
  })

  const expectedPassed = ['legacyPointCount', 'legacyPointCountByReturn']
  const expectedFailed = difference(
    Object.keys(manualHeaderSuite),
    expectedPassed,
  )

  const [passed, failed] = splitChecks(checks)

  expect(getCheckIds(passed)).toEqual(expectedPassed)
  expect(getCheckIds(failed)).toEqual(expectedFailed)
})

test('getter header branch-coverage', async () => {
  expect(() => {
    formatGuid(new Uint8Array(15))
  }).toThrow('Invalid GUID buffer length')
  expect(formatGuid(new Uint8Array(16))).toEqual(
    '00000000-0000-0000-0000000000000000',
  )
  expect(() => {
    parsePoint(new Uint8Array(25))
  }).toThrow('Invalid tuple buffer length')
  expect(parsePoint(new Uint8Array(24))).toEqual([0, 0, 0])
})
