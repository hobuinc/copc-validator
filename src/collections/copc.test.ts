import { difference } from 'lodash'
import { ellipsoidFiles, getCopcItems, maxThreads } from 'test'
import { Check } from 'types'
import {
  allCheckIds,
  checkAll,
  expectedChecks,
  findCheck,
  getCheckIds,
  invokeCollection,
  splitChecks,
} from 'utils'
import { CopcCollection } from './copc'

const items = getCopcItems()

test('CopcCollection shallow all-pass', async () => {
  const { filepath, get, copc } = await items
  const collection = CopcCollection({ filepath, get, copc })
  const checks = await invokeCollection(collection)

  const [expectedPassed, expectedFailed] = await expectedChecks({
    collection,
    expectedFailed: ['cube within bounds'],
  })
  const [passed, failed] = splitChecks(checks)

  expect(getCheckIds(passed)).toEqual(expectedPassed)
  expect(getCheckIds(failed)).toEqual(expectedFailed)
})

test('CopcCollection shallow oldCopc', async () => {
  const { filepath, get, copc } = await getCopcItems(ellipsoidFiles.oldCopc)
  const deep = false
  const collection = CopcCollection({
    filepath,
    get,
    copc,
    deep,
    maxThreads,
  })

  const checks = await invokeCollection(collection)

  const checkIds = await allCheckIds(collection)
  const expectedFailed = ['cube within bounds', 'rgbi', 'gpsTime']
  const expectedPassed = difference(checkIds, expectedFailed)

  const [passed, failed] = splitChecks(checks)
  expect(getCheckIds(passed)).toEqual(expectedPassed)
  expect(getCheckIds(failed)).toEqual(expectedFailed)

  const rgbi = findCheck(failed, 'rgbi')
  expect(rgbi).toHaveProperty('status', 'warn')
  expect(rgbi).toHaveProperty(
    'info',
    'Points appear to contain 8-bit RGBI. Should be scaled to 16-bit.',
  )

  const cubeWithinBounds = findCheck(failed, 'cube within bounds')
  expect(cubeWithinBounds).toHaveProperty('status', 'fail')
  expect(cubeWithinBounds).toHaveProperty(
    'info',
    'COPC cube midpoint outside of Las Bounds: Z',
  )

  const gpsTime = findCheck(failed, 'gpsTime')
  expect(gpsTime).toHaveProperty('status', 'fail')
  expect(gpsTime).toHaveProperty(
    'info',
    'GpsTime out of bounds: [ 0-0-0-0,1-0-0-0,1-0-1-0,1-1-1-0 ]',
  )
})
