import { invokeAllChecks } from 'checks/utils'
import { Copc, Getter } from 'copc'
import { ellipsoidFiles } from 'test'
import { getItems } from './common.test'
import header from './header'

const items = getItems()

test('header all-pass', async () => {
  const { copc } = await items
  const checks = await invokeAllChecks({ source: copc, suite: header })
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})

test('header critial-fail', async () => {
  const checks = await invokeAllChecks({ source: {} as Copc, suite: header })
  checks.forEach((check) => expect(check).toHaveProperty('status', 'fail'))
})

test.todo('other header tests')
