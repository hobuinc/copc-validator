import { difference } from 'lodash'
import { ellipsoidFiles, getCopcItems, maxThreads } from 'test'
import { Check } from 'types'
import {
  collectionToIds,
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
  checkAll(checks)
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

  // const checkIds = await collectionToIds(collection)
  // const expectedFailed = ['rgbi', 'gpsTime']
  // const expectedPassed = difference(checkIds, expectedFailed)
  const [expectedPassed, expectedFailed] = await expectedChecks({
    collection,
    expected: ['rgbi', 'gpsTime'],
  })

  const [passed, failed] = splitChecks(checks)
  expect(getCheckIds(passed)).toEqual(expectedPassed)
  expect(getCheckIds(failed)).toEqual(expectedFailed)

  const rgbi = findCheck(failed, 'rgbi')
  expect(rgbi).toHaveProperty('status', 'warn')
  expect(rgbi).toHaveProperty(
    'info',
    'All Nodes contain 8-bit RGBI data. Should be scaled to 16-bit.',
  )

  const gpsTime = findCheck(failed, 'gpsTime')
  expect(gpsTime).toHaveProperty('status', 'fail')
  expect(gpsTime).toHaveProperty(
    'info',
    'GpsTime out of bounds: [ ALL-BUT-ONE-NODE: 1-1-0-0 ]',
  )
})
