import { getLasItems } from 'test'
import vlrSuite from '../vlrs'
import { getCheckIds, invokeAllChecks, splitChecks } from '../../checks'
import { difference } from 'lodash'

const items = getLasItems()

test('las vlrs all-expected', async () => {
  const { header, vlrs } = await items
  const checks = await invokeAllChecks({
    source: { header, vlrs },
    suite: vlrSuite,
  })
  const expectedFailed = ['copc-info', 'copc-hierarchy']
  const expectedPassed = difference(Object.keys(vlrSuite), expectedFailed)

  const [passed, failed] = splitChecks(checks)

  expect(getCheckIds(passed)).toEqual(expectedPassed)
  expect(getCheckIds(failed)).toEqual(expectedFailed)
})

test('las vlrs failures', async () => {
  const { header: goodHeader, vlrs } = await items
  // need to set evlrCount because double 0 is still zero, and so is 0 - all,
  // so the evlrCount test is not normally affected for the ellipsoid-laz14 file
  const header = { ...goodHeader, evlrCount: 1 }

  const emptyVlrChecks = await invokeAllChecks({
    source: { header, vlrs: [] },
    suite: vlrSuite,
  })
  emptyVlrChecks.forEach((check) =>
    expect(check).not.toHaveProperty('status', 'pass'),
  )

  const doubleVlrChecks = await invokeAllChecks({
    source: { header, vlrs: vlrs.concat(vlrs) },
    suite: vlrSuite,
  })
  doubleVlrChecks.forEach((check) =>
    expect(check).not.toHaveProperty('status', 'pass'),
  )
})

test.todo('other las vlrs tests')
