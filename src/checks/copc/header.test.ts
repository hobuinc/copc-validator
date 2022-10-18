import { invokeAllChecks } from 'checks'
import { Getter, Las } from 'copc'
import { getCopcItems } from 'test'
import header from 'checks/las/header'
import { copcHeaderSourcer } from 'checks'

const items = getCopcItems()

test('header all-pass', async () => {
  const { get, copc } = await items
  const checks = await invokeAllChecks([
    { source: copc.header, suite: header },
    await copcHeaderSourcer(get),
  ])
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})

test('header critial-fail', async () => {
  const get = Getter.create(__filename)
  const checks = await invokeAllChecks([
    { source: {} as Las.Header, suite: header },
    await copcHeaderSourcer(get),
  ])
  checks.forEach((check) => expect(check).toHaveProperty('status', 'fail'))
})

test.todo('other header tests')
