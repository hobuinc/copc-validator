import { ellipsoidFilename } from 'test'
import { Copc } from 'copc'
import vlrs from './vlrs'
import { omit } from 'lodash'

const filename = ellipsoidFilename

test('vlrs all-pass', async () => {
  const copc = await Copc.create(filename)
  const checks = vlrs.generate(copc, vlrs, 'vlrs')

  expect(checks.length).toEqual(Object.keys(omit(vlrs, 'generate')).length)

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
  const checks = vlrs.generate(badCopc, vlrs, 'vlrs')

  expect(checks.find((c) => c.id === 10)).toHaveProperty('status', 'fail')
  expect(checks.find((c) => c.id === 11)).toHaveProperty('status', 'fail')
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
  const checks = vlrs.generate(badCopc, vlrs, 'vlrs')

  expect(checks.find((c) => c.id === 12)).toHaveProperty('status', 'warn')
})
