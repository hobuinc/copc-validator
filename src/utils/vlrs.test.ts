import { Las } from 'copc'
import { getCopcItems } from 'test'
import { vlrCheck } from './vlrs'

const items = getCopcItems()

test('vlrCheck', async () => {
  const {
    copc: { vlrs },
  } = await items
  const userId = 'copc'
  const recordId = 1
  const finalCheck = (v: Las.Vlr) =>
    !v.isExtended && v.contentOffset === 429 && v.contentLength === 160
  const infoOnFailure = 'this test did not pass'
  const infoOnSuccess = 'aha! this test succeeded!'

  const succeeded = { status: 'pass' }
  const failed = { status: 'fail' }
  const failedRequired = { status: 'fail', info: 'Failed to find VLR: copc-1' }
  const failedRecommended = {
    status: 'warn',
    info: 'Failed to find recommended VLR: copc-1',
  }
  const failedDuplicate = { status: 'warn', info: 'Found multiple copc-1 VLRs' }
  const succeededWithInfo = { status: 'pass', info: infoOnSuccess }
  const failedWithInfo = { status: 'fail', info: infoOnFailure }

  const emptyVlrs = [] as Las.Vlr[]
  const doubleVlrs = vlrs.concat(vlrs)

  expect(vlrCheck({ vlrs, userId, recordId })).toEqual(succeeded)
  expect(vlrCheck({ vlrs: emptyVlrs, userId, recordId })).toEqual(
    failedRequired,
  )
  expect(
    vlrCheck({ vlrs: emptyVlrs, userId, recordId, required: true }),
  ).toEqual(failedRequired)
  expect(
    vlrCheck({ vlrs: emptyVlrs, userId, recordId, required: false }),
  ).toEqual(failedRecommended)
  expect(vlrCheck({ vlrs: doubleVlrs, userId, recordId })).toEqual(
    failedDuplicate,
  )

  expect(vlrCheck({ vlrs, userId, recordId, finalCheck })).toEqual(succeeded)
  expect(
    vlrCheck({
      vlrs,
      userId,
      recordId,
      finalCheck: (v) => v.contentOffset !== 429,
    }),
  ).toEqual(failed)
  expect(
    vlrCheck({ vlrs, userId, recordId, finalCheck, infoOnSuccess }),
  ).toEqual(succeededWithInfo)
  expect(
    vlrCheck({
      vlrs,
      userId,
      recordId,
      finalCheck: (v) => v.contentOffset !== 429,
      infoOnFailure,
    }),
  ).toEqual(failedWithInfo)

  expect(
    vlrCheck({
      vlrs,
      userId,
      recordId,
      finalCheck,
      infoOnSuccess,
      infoOnFailure,
    }),
  ).toEqual(succeededWithInfo)
  expect(
    vlrCheck({
      vlrs,
      userId,
      recordId,
      finalCheck: (v) => v.contentOffset !== 429,
      infoOnSuccess,
      infoOnFailure,
    }),
  ).toEqual(failedWithInfo)
})
