import { Getter } from 'copc'
import { ellipsoidFiles, getCopcItems } from 'test'
import { checkAll, invokeAllChecks } from 'utils'
import { vlrSuite, manualVlrSuite } from './vlrs'

const items = getCopcItems()

test('vlrSuite all-pass', async () => {
  const {
    copc: { header, vlrs },
  } = await items
  const checks = await invokeAllChecks({
    source: { header, vlrs },
    suite: vlrSuite,
  })
  checkAll(checks)
})

test('vlrSuite failures', async () => {
  const checks = await invokeAllChecks({
    source: { header: {}, vlrs: [] },
    suite: vlrSuite,
  })
  checkAll(checks, false)
})

test('manualVlrSuite all-pass', async () => {
  const {
    get,
    copc: { vlrs },
  } = await items
  const checks = await invokeAllChecks({
    source: { get, vlrs },
    suite: manualVlrSuite,
  })
  checkAll(checks)
})

test('manualVlrSuite failures', async () => {
  const get = Getter.create(ellipsoidFiles.sh)
  const {
    copc: { vlrs },
  } = await items
  const checks = await invokeAllChecks({
    source: { get, vlrs },
    suite: manualVlrSuite,
  })
  checkAll(checks, false)

  const emptyVlrChecks = await invokeAllChecks({
    source: { get, vlrs: [] },
    suite: manualVlrSuite,
  })
  expect(emptyVlrChecks).toEqual([
    {
      id: 'wkt',
      status: 'fail',
      info: 'Failed to find WKT SRS VLR',
      description:
        'WKT VLR (string) exists and successfully initializes proj4js',
    },
  ])

  const doubleVlrChecks = await invokeAllChecks({
    source: { get, vlrs: vlrs.concat(vlrs) },
    suite: manualVlrSuite,
  })
  expect(doubleVlrChecks).toEqual([
    {
      id: 'wkt',
      status: 'fail',
      info: 'Found multiple WKT SRS VLRs',
      description:
        'WKT VLR (string) exists and successfully initializes proj4js',
    },
  ])
  // checkAll(doubleVlrChecks, false)
})
