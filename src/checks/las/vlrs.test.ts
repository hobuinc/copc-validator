import { ellipsoidFiles, getLasItems } from 'test'
import vlrSuite, { checkVlrDuplicates, removeVlr } from './vlrs'
import { getCheckIds, invokeAllChecks, splitChecks } from 'checks'
import { difference } from 'lodash'
import { Copc, Getter } from 'copc'

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

test('vlrs utilities', async () => {
  const get = Getter.create(ellipsoidFiles.copc)
  const { vlrs } = await Copc.create(get)
  const vlrsMinusCopcInfo = removeVlr(vlrs, 'copc', 1)
  expect(vlrsMinusCopcInfo).not.toContainEqual({
    userId: 'copc',
    recordId: 1,
    contentOffset: 429,
    contentLength: 160,
    description: 'COPC info VLR',
    isExtended: false,
  })
  expect(vlrsMinusCopcInfo).toContainEqual({
    userId: 'copc',
    recordId: 1000,
    contentOffset: 1184242,
    contentLength: 160,
    description: 'EPT Hierarchy',
    isExtended: true,
  })
  expect(checkVlrDuplicates(vlrs, 'copc', 1)).toBe(false)
  const vlrsPlusDupedCopcInfo = [
    ...vlrs,
    {
      userId: 'copc',
      recordId: 1,
      contentOffset: 429,
      contentLength: 160,
      description: 'COPC info VLR',
      isExtended: false,
    },
  ]
  expect(checkVlrDuplicates(vlrsPlusDupedCopcInfo, 'copc', 1)).toBe(true)
})
