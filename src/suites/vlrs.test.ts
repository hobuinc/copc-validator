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

  const expectedOutput = [
    {
      id: 'wkt',
      status: 'fail',
      info: '',
      description:
        'WKT VLR (string) exists and successfully initializes proj4js',
    },
    {
      id:'laz',
      status: 'fail',
      info: '',
      description:
        'LAZ VLR exists and contains valid data fields',
    },
    {
      id:'copc-info',
      status: 'fail',
      info: '',
      description:
        'COPC info VLR exists and contains valid data fields',
    }
  ]

  const emptyVlrChecks = await invokeAllChecks({
    source: { get, vlrs: [] },
    suite: manualVlrSuite,
  })
  expectedOutput[0].info = 'Failed to find WKT SRS VLR'
  expectedOutput[1].info = 'Failed to find LAZ VLR'
  expectedOutput[2].info = 'Failed to find copc-info VLR'
  expect(emptyVlrChecks).toEqual(expectedOutput)

  const doubleVlrChecks = await invokeAllChecks({
    source: { get, vlrs: vlrs.concat(vlrs) },
    suite: manualVlrSuite,
  })
  expectedOutput[0].info = 'Found multiple WKT SRS VLRs'
  expectedOutput[1].info = 'Found multiple LAZ VLRs'
  expectedOutput[2].info = 'Found multiple copc-info VLRs'
  expect(doubleVlrChecks).toEqual(expectedOutput)
  // checkAll(doubleVlrChecks, false)
})
