import { Getter } from 'copc'
import { getLasItems, ellipsoidFiles } from 'test'
import {
  invokeAllChecks,
  getterToHeader,
  splitChecks,
  getCheckIds,
} from '../../checks'
import headerSuite, { headerChecks } from './header'
import lasHeaderSuite from '../las/header'
import { difference } from 'lodash'

const get = Getter.create(ellipsoidFiles.laz14)
const badGet = Getter.create(ellipsoidFiles.fake)

test('getter header all-expected', async () => {
  const { header } = await getLasItems()
  const { buffer, dv } = await getterToHeader(get)
  const checks = await invokeAllChecks({
    source: { get, buffer, dv },
    suite: headerSuite,
  })
  expect(checks).toEqual(
    await invokeAllChecks({ source: header, suite: lasHeaderSuite }),
  )
})

test('getter header fake-copc', async () => {
  const { buffer, dv } = await getterToHeader(badGet)
  const checks = await invokeAllChecks({
    source: { get: badGet, buffer, dv },
    suite: headerSuite,
  })

  const expectedPassed = ['fileSignature', 'headerLength']
  const expectedFailed = difference(Object.keys(headerChecks), expectedPassed)

  const [passed, failed] = splitChecks(checks)

  expect(getCheckIds(passed)).toEqual(expectedPassed)
  expect(getCheckIds(failed)).toEqual(expectedFailed)
})
