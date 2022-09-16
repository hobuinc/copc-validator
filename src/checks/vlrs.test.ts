import { ellipsoidFilename } from 'test'
import { Copc } from 'copc'
import vlrs from './vlrs'
import { mapChecks } from './common'

const filename = ellipsoidFilename

test('vlrs all-pass', async () => {
  const copc = await Copc.create(filename)
  const checks = mapChecks(copc, vlrs)

  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})

test('vlrs missing-required', async () => {
  const copc = await Copc.create(filename)
  const badCopc = {
    ...copc,
    header: {
      ...copc.header,
      vlrCount: 1,
    },
    vlrs: copc.vlrs.filter((v) => v.userId !== 'copc'),
  }
  const checks = mapChecks(badCopc, vlrs)

  expect(checks.find((c) => c.id.includes('copc-info'))).toHaveProperty(
    'status',
    'fail',
  )
  expect(checks.find((c) => c.id.includes('copc-hierarchy'))).toHaveProperty(
    'status',
    'fail',
  )
})

test('vlrs missing-recommended', async () => {
  const copc = await Copc.create(filename)
  const badCopc = {
    ...copc,
    header: {
      ...copc.header,
      vlrCount: 2,
    },
    vlrs: copc.vlrs.filter((v) => v.userId !== 'laszip encoded'),
  }
  const checks = mapChecks(badCopc, vlrs)

  expect(checks.find((c) => c.id.includes('laszip-encoded'))).toHaveProperty(
    'status',
    'warn',
  )
})
