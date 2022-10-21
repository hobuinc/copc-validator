import { basicCheck, complexCheck } from './checks'

test('basicCheck', () => {
  expect(basicCheck(1, 1)).toEqual({ status: 'pass' })
  expect(basicCheck(1, 2)).toEqual({ status: 'fail' })
  expect(basicCheck(1, [1, 2, 3])).toEqual({ status: 'pass' })
  expect(basicCheck(1, [4, 5, 6])).toEqual({ status: 'fail' })
  expect(
    basicCheck([1, 2, 3], (arr) => arr.reduce((p, c) => p + c, 0) === 6),
  ).toEqual({ status: 'pass' })
  expect(
    basicCheck([1, 2, 3], (arr) => arr.reduce((p, c) => p + c, 0) === 7),
  ).toEqual({ status: 'fail' })
  // with info
  const info = 'some info string'
  expect(basicCheck(1, 1, info)).toEqual({ status: 'pass', info })
  expect(basicCheck(1, 2, info)).toEqual({ status: 'fail', info })
  expect(basicCheck(1, [1, 2, 3], info)).toEqual({ status: 'pass', info })
  expect(basicCheck(1, [4, 5, 6], info)).toEqual({ status: 'fail', info })
  expect(
    basicCheck([1, 2, 3], (arr) => arr.reduce((p, c) => p + c, 0) === 6, info),
  ).toEqual({ status: 'pass', info })
  expect(
    basicCheck([1, 2, 3], (arr) => arr.reduce((p, c) => p + c, 0) === 7, info),
  ).toEqual({ status: 'fail', info })
})

test('complexCheck', () => {
  const infoOnFailure = 'this test did not pass'
  const infoOnSuccess = 'aha! this test succeeded!'
  const succeeded = { status: 'pass' }
  const succeededWithInfo = { status: 'pass', info: infoOnSuccess }
  const failed = { status: 'fail' }
  const failedWithInfo = { status: 'fail', info: infoOnFailure }
  const warning = { status: 'warn', info: 'No information provided' }
  const warningWithInfo = { status: 'warn', info: infoOnFailure }

  // no info
  expect(complexCheck({ source: 1, checker: 1 })).toEqual(succeeded)
  expect(complexCheck({ source: 1, checker: [3, 2, 1] })).toEqual(succeeded)
  expect(complexCheck({ source: 1, checker: (s) => s < 5 })).toEqual(succeeded)
  expect(complexCheck({ source: 1, checker: 2 })).toEqual(failed)
  expect(complexCheck({ source: 1, checker: [4, 3, 2] })).toEqual(failed)
  expect(complexCheck({ source: 1, checker: (s) => s > 5 })).toEqual(failed)
  expect(complexCheck({ source: 1, checker: 2, warning: true })).toEqual(
    warning,
  )
  expect(
    complexCheck({ source: 1, checker: [4, 3, 2], warning: true }),
  ).toEqual(warning)
  expect(
    complexCheck({ source: 1, checker: (s) => s > 5, warning: true }),
  ).toEqual(warning)

  // infoOnSuccess
  expect(complexCheck({ source: 1, checker: 1, infoOnSuccess })).toEqual(
    succeededWithInfo,
  )
  expect(
    complexCheck({ source: 1, checker: [3, 2, 1], infoOnSuccess }),
  ).toEqual(succeededWithInfo)
  expect(
    complexCheck({ source: 1, checker: (s) => s < 5, infoOnSuccess }),
  ).toEqual(succeededWithInfo)
  expect(complexCheck({ source: 1, checker: 2, infoOnSuccess })).toEqual(failed)
  expect(
    complexCheck({ source: 1, checker: [4, 3, 2], infoOnSuccess }),
  ).toEqual(failed)
  expect(
    complexCheck({ source: 1, checker: (s) => s > 5, infoOnSuccess }),
  ).toEqual(failed)
  expect(
    complexCheck({ source: 1, checker: 2, warning: true, infoOnSuccess }),
  ).toEqual(warning)
  expect(
    complexCheck({
      source: 1,
      checker: [4, 3, 2],
      warning: true,
      infoOnSuccess,
    }),
  ).toEqual(warning)
  expect(
    complexCheck({
      source: 1,
      checker: (s) => s > 5,
      warning: true,
      infoOnSuccess,
    }),
  ).toEqual(warning)

  // infoOnFailure
  expect(complexCheck({ source: 1, checker: 1, infoOnFailure })).toEqual(
    succeeded,
  )
  expect(
    complexCheck({ source: 1, checker: [3, 2, 1], infoOnFailure }),
  ).toEqual(succeeded)
  expect(
    complexCheck({ source: 1, checker: (s) => s < 5, infoOnFailure }),
  ).toEqual(succeeded)
  expect(complexCheck({ source: 1, checker: 2, infoOnFailure })).toEqual(
    failedWithInfo,
  )
  expect(
    complexCheck({ source: 1, checker: [4, 3, 2], infoOnFailure }),
  ).toEqual(failedWithInfo)
  expect(
    complexCheck({ source: 1, checker: (s) => s > 5, infoOnFailure }),
  ).toEqual(failedWithInfo)
  expect(
    complexCheck({ source: 1, checker: 2, warning: true, infoOnFailure }),
  ).toEqual(warningWithInfo)
  expect(
    complexCheck({
      source: 1,
      checker: [4, 3, 2],
      warning: true,
      infoOnFailure,
    }),
  ).toEqual(warningWithInfo)
  expect(
    complexCheck({
      source: 1,
      checker: (s) => s > 5,
      warning: true,
      infoOnFailure,
    }),
  ).toEqual(warningWithInfo)

  // infoOnSuccess & infoOnFailure
  expect(
    complexCheck({ source: 1, checker: 1, infoOnSuccess, infoOnFailure }),
  ).toEqual(succeededWithInfo)
  expect(
    complexCheck({
      source: 1,
      checker: [3, 2, 1],
      infoOnSuccess,
      infoOnFailure,
    }),
  ).toEqual(succeededWithInfo)
  expect(
    complexCheck({
      source: 1,
      checker: (s) => s < 5,
      infoOnSuccess,
      infoOnFailure,
    }),
  ).toEqual(succeededWithInfo)
  expect(
    complexCheck({ source: 1, checker: 2, infoOnSuccess, infoOnFailure }),
  ).toEqual(failedWithInfo)
  expect(
    complexCheck({
      source: 1,
      checker: [4, 3, 2],
      infoOnSuccess,
      infoOnFailure,
    }),
  ).toEqual(failedWithInfo)
  expect(
    complexCheck({
      source: 1,
      checker: (s) => s > 5,
      infoOnSuccess,
      infoOnFailure,
    }),
  ).toEqual(failedWithInfo)
  expect(
    complexCheck({
      source: 1,
      checker: 2,
      warning: true,
      infoOnSuccess,
      infoOnFailure,
    }),
  ).toEqual(warningWithInfo)
  expect(
    complexCheck({
      source: 1,
      checker: [4, 3, 2],
      warning: true,
      infoOnSuccess,
      infoOnFailure,
    }),
  ).toEqual(warningWithInfo)
  expect(
    complexCheck({
      source: 1,
      checker: (s) => s > 5,
      warning: true,
      infoOnSuccess,
      infoOnFailure,
    }),
  ).toEqual(warningWithInfo)
})
