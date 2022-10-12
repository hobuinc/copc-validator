import { invokeAllChecks } from 'checks'
import { Copc, Getter } from 'copc'
import { ellipsoidFiles, getCopcItems } from 'test'
import header, { headerGetter } from './header'
import { resolve } from 'path'

const items = getCopcItems()

test('header all-pass', async () => {
  const { get, copc } = await items
  const checks = await invokeAllChecks([
    { source: copc, suite: header },
    { source: get, suite: headerGetter },
  ])
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})

test('header critial-fail', async () => {
  const checks = await invokeAllChecks([
    { source: {} as Copc, suite: header },
    { source: Getter.create(__filename), suite: headerGetter },
  ])
  checks.forEach((check) => expect(check).toHaveProperty('status', 'fail'))
})

test('headerGetter branch-coverage', async () => {
  const checks = await invokeAllChecks({
    source: Getter.create(resolve(__dirname, '../../../jest.config.js')),
    suite: headerGetter,
  })
  expect(checks).toEqual([
    {
      id: 'header-get.parse',
      status: 'fail',
      info: 'Invalid header: must be at least 375 bytes',
    },
  ])
})

test.todo('other header tests')
