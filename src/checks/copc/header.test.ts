import { invokeAllChecks } from 'checks/utils'
import { Copc, Getter } from 'copc'
import { ellipsoidFiles } from 'test'
import header from './header'

const get = Getter.create(ellipsoidFiles.copc)

test('header all-pass', async () => {
  const copc = await Copc.create(get)
  const checks = await invokeAllChecks({ source: copc, suite: header })
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})

test('header critial-fail', async () => {
  const checks = await invokeAllChecks({ source: {} as Copc, suite: header })
  checks.forEach((check) => expect(check).toHaveProperty('status', 'fail'))
})

test.todo('all other header checks')
