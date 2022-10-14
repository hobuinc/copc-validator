import { findCheck, invokeAllChecks } from 'checks'
import { Copc, Getter } from 'copc'
import { ellipsoidFiles, getCopcItems } from 'test'
import header from './header'
import { copcHeaderSuite } from 'checks'
import { resolve } from 'path'

const items = getCopcItems()

test('header all-pass', async () => {
  const { get, copc } = await items
  const checks = await invokeAllChecks([
    { source: copc, suite: header },
    { source: get, suite: copcHeaderSuite },
  ])
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})

test('header critial-fail', async () => {
  const checks = await invokeAllChecks([
    { source: {} as Copc, suite: header },
    { source: Getter.create(__filename), suite: copcHeaderSuite },
  ])
  checks.forEach((check) => expect(check).toHaveProperty('status', 'fail'))
})

test.todo('other header tests')
