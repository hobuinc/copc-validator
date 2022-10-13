import { Getter } from 'copc'
import { getLasItems, ellipsoidFiles } from 'test'
import {
  invokeAllChecks,
  getterToHeader,
  splitChecks,
  getCheckIds,
} from 'checks'
import headerSuite, {
  formatGuid,
  fullHeaderSuite,
  parsePoint,
  RelevantHeader,
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
      id: 'header-get.parse',
      info: 'Invalid header: must be at least 375 bytes',
      status: 'fail',
    },
  ])
  // const expectedPassed = ['fileSignature', 'headerLength']
  // const expectedFailed = difference(
  //   Object.keys(fullHeaderSuite),
  //   expectedPassed,
  // )
  // console.log(checks)

  // const [passed, failed] = splitChecks(checks)

  // expect(getCheckIds(passed)).toEqual(expectedPassed)
  // expect(getCheckIds(failed)).toEqual(expectedFailed)
})

test('getter header bad-file', async () => {
  const { buffer, dv } = await getterToHeader(badGet)
  const checks = await invokeAllChecks({
    source: { get: badGet, buffer, dv },
    suite: headerSuite,
  })

  checks.forEach((check) => expect(check).not.toHaveProperty('status', 'pass'))
  // should run fullHeaderSuite but it is not :(
  // TODO: fix fullHeaderSuite
})

test('getter header branch-coverage', async () => {
  expect(() => {
    formatGuid(new Uint8Array(15))
  }).toThrow('Invalid GUID buffer length')
  expect(() => {
    parsePoint(new Uint8Array(25))
  }).toThrow('Invalid tuple buffer length')
})

test('fullHeaderSuite', async () => {
  const goodHeader: RelevantHeader = {
    fileSignature: 'LASF',
    majorVersion: 1,
    minorVersion: 4,
    headerLength: 375,
    pointDataRecordFormat: 6,
    legacyPointCount: 0,
    legacyPointCountByReturn: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    pointCount: 100000,
    pointCountByReturn: [50002, 49998, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  }
  const goodChecks = await invokeAllChecks({
    source: goodHeader,
    suite: fullHeaderSuite,
  })
  goodChecks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
  const badHeader: RelevantHeader = {
    fileSignature: 'LASf',
    majorVersion: 2,
    minorVersion: 3,
    headerLength: 374,
    pointDataRecordFormat: 9,
    legacyPointCount: 100,
    legacyPointCountByReturn: [0, 0, 1, 0, 0, 0, 0, 0],
    pointCount: 100009,
    pointCountByReturn: [50002, 49998, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
  }
  const badChecks = await invokeAllChecks({
    source: badHeader,
    suite: fullHeaderSuite,
  })
  badChecks.forEach((check) =>
    expect(check).not.toHaveProperty('status', 'pass'),
  )
})
