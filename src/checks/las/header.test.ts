import headerSuite from './header'
import { Binary, Getter, Las } from 'copc'
import { getLasItems } from 'test'
import { findCheck, invokeAllChecks } from 'checks'

const items = getLasItems()

test('header all-pass', async () => {
  const { header } = await items
  const checks = await invokeAllChecks({ source: header, suite: headerSuite })
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})

test.todo('header info')
