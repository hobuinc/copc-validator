import { buildCopcSuite } from '.'
import { findCheck, getCheckIds, invokeAllChecks, splitChecks } from 'checks'
import { ellipsoidFiles, getCopcItems } from 'test'

const items = getCopcItems()

test('buildCopcSuite shallow all-pass', async () => {
  const { get, copc } = await items
  const checks = await invokeAllChecks({
    source: { get, copc },
    suite: buildCopcSuite(), //default parameters
  })
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})

test('buildCopcSuite shallow oldCopc', async () => {
  const { get, copc } = await getCopcItems(ellipsoidFiles.oldCopc)
  const suite = buildCopcSuite(false)
  const checks = await invokeAllChecks({
    source: { get, copc },
    suite,
  })
  const expectedFailed = ['rgbi', 'gpsTime']
  const expectedPassed = [
    'minorVersion',
    'headerLength',
    'pointDataRecordFormat',
    'pointCountByReturn',
    'vlrCount',
    'evlrCount',
    'copc-info',
    'copc-hierarchy',
    'laszip-encoded',
    'fileSignature',
    'majorVersion',
    'minorVersion-manualParse',
    'headerLength-manualParse',
    'legacyPointCount',
    'legacyNumberOfPointsByReturn',
    'rgb',
    'xyz',
    'returns',
  ]

  const [passed, failed] = splitChecks(checks)

  expect(getCheckIds(passed)).toEqual(expectedPassed)
  expect(getCheckIds(failed)).toEqual(expectedFailed)
  expect(findCheck(failed, 'rgbi')).toHaveProperty('status', 'warn')
  expect(findCheck(failed, 'gpsTime')).toHaveProperty('status', 'fail')
})
