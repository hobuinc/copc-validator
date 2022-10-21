import { difference } from 'lodash'
import { ellipsoidFiles, getCopcItems, maxThreads } from 'test'
import { Check } from 'types'
import {
  checkAll,
  findCheck,
  getCheckIds,
  invokeCollection,
  splitChecks,
} from 'utils'
import { CopcCollection } from './copc'

const items = getCopcItems()

test('CopcCollection shallow all-pass', async () => {
  const { filepath, get, copc } = await items
  const checks = await invokeCollection(CopcCollection({ filepath, get, copc }))
  checkAll(checks)
})

test('CopcCollection shallow oldCopc', async () => {
  const { filepath, get, copc } = await getCopcItems(ellipsoidFiles.oldCopc)
  const deep = false
  const collection = await CopcCollection({
    filepath,
    get,
    copc,
    deep,
    maxThreads,
  })

  const checks = await invokeCollection(collection)

  const allCheckIds = (
    await Promise.all(
      collection.map(async (s) => {
        const { suite } = await s
        return Object.keys(suite)
      }),
    )
  ).flat()
  const expectedFailed = ['rgbi', 'gpsTime']
  const expectedPassed = difference(allCheckIds, expectedFailed)

  const [passed, failed] = splitChecks(checks)
  expect(getCheckIds(passed)).toEqual(expectedPassed)
  expect(getCheckIds(failed)).toEqual(expectedFailed)

  const rgbi = findCheck(failed, 'rgbi')
  expect(rgbi).toHaveProperty('status', 'warn')
  expect(rgbi).toHaveProperty(
    'info',
    'Points appear to contain 8-bit RGBI. Should be scaled to 16-bit.',
  )

  const gpsTime = findCheck(failed, 'gpsTime')
  expect(gpsTime).toHaveProperty('status', 'fail')
  expect(gpsTime).toHaveProperty(
    'info',
    'GpsTime out of bounds: [ 0-0-0-0,1-0-0-0,1-0-1-0,1-1-1-0 ]',
  )
})
