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
  manualHeaderSuite,
  manualHeaderParse,
  // fullHeaderSuite,
  parsePoint,
  // FullHeader,
} from './header'
import lasHeaderSuite from 'checks/las/header'

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

test('getter header branch-coverage', async () => {
  expect(() => {
    formatGuid(new Uint8Array(15))
  }).toThrow('Invalid GUID buffer length')
  expect(() => {
    parsePoint(new Uint8Array(25))
  }).toThrow('Invalid tuple buffer length')
})
