import headerSuite from './header'
import { getLasItems } from 'test'
import { invokeAllChecks } from 'checks'

const items = getLasItems()

test('header all-pass', async () => {
  const { header } = await items
  const checks = await invokeAllChecks({ source: header, suite: headerSuite })
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})

test.todo('header info')
