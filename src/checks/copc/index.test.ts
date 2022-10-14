import { CopcSuite } from '.'
import { findCheck, getCheckIds, invokeAllChecks, splitChecks } from 'checks'
import { ellipsoidFiles, getCopcItems } from 'test'

const items = getCopcItems()

test('buildCopcSuite shallow all-pass', async () => {
  const { get, copc } = await items
  const checks = await invokeAllChecks({
    source: { get, copc },
    suite: CopcSuite(), //default parameters
  })
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})

test('buildCopcSuite shallow oldCopc', async () => {
  const { get, copc } = await getCopcItems(ellipsoidFiles.oldCopc)
  const suite = CopcSuite(false)
  const checks = await invokeAllChecks({
    source: { get, copc },
    suite,
  })
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
