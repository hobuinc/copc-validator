// import { CopcSuite } from '.'
import {
  findCheck,
  getCheckIds,
  invokeAllChecks,
  invokeCollection,
  splitChecks,
  CopcCollection,
} from 'checks'
import { ellipsoidFiles, getCopcItems } from 'test'

const items = getCopcItems()

test('buildCopcSuite shallow all-pass', async () => {
  const { filepath, get, copc } = await items
  const checks = await invokeCollection(CopcCollection(filepath, get, copc))
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})

test('buildCopcSuite shallow oldCopc', async () => {
  const { filepath, get, copc } = await getCopcItems(ellipsoidFiles.oldCopc)
  const checks = await invokeCollection(
    CopcCollection(filepath, get, copc, false),
  )
  const expectedFailed = ['rgbi', 'gpsTime']
  const expectedPassed = [
    'minorVersion',
    'pointDataRecordFormat',
    'headerLength',
    'pointCountByReturn',
    'vlrCount',
    'evlrCount',
    'copc-info',
    'copc-hierarchy',
    'laszip-encoded',
    'legacyPointCount',
    'legacyPointCountByReturn',
    'wkt',
    'rgb',
    'xyz',
    'returnNumber',
  ]

  const [passed, failed] = splitChecks(checks)

  expect(getCheckIds(passed)).toEqual(expectedPassed)
  expect(getCheckIds(failed)).toEqual(expectedFailed)
  expect(findCheck(failed, 'rgbi')).toHaveProperty('status', 'warn')
  expect(findCheck(failed, 'gpsTime')).toHaveProperty('status', 'fail')
})
