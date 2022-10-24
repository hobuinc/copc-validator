import { Binary, Getter, Las } from 'copc'
import { getCopcItems } from 'test'
import { checkAll, findCheck, invokeAllChecks } from 'utils'
import { headerSuite, manualHeaderSuite } from './header'

const items = getCopcItems()

test('headerSuite all-pass', async () => {
  const { copc } = await items
  const checks = await invokeAllChecks({ source: copc, suite: headerSuite })
  // checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
  checkAll(checks)
})

test('headerSuite failure', async () => {
  const checks = await invokeAllChecks({
    source: {} as Las.Header,
    suite: headerSuite,
  })
  // checks.forEach((check) => expect(check).not.toHaveProperty('status', 'pass'))
  checkAll(checks, false)
})

test('manualHeaderSuite all-pass', async () => {
  const { get } = await items
  const buffer = await get(0, Las.Constants.minHeaderLength)
  const dv = Binary.toDataView(buffer)
  const checks = await invokeAllChecks({
    source: { buffer, dv },
    suite: manualHeaderSuite,
  })
  // checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
  checkAll(checks)
})

test('manualHeaderSuite failure', async () => {
  const get = Getter.create(__filename)
  const buffer = await get(0, Las.Constants.minHeaderLength)
  const dv = Binary.toDataView(buffer)
  const checks = await invokeAllChecks({
    source: { buffer, dv },
    suite: manualHeaderSuite,
  })
  // checks.forEach((check) => expect(check).not.toHaveProperty('status', 'pass'))
  checkAll(checks, false)
})

test('manualHeaderSuite branch-coverage', async () => {
  const { get } = await items
  const buffer = await get(0, Las.Constants.minHeaderLength)
  const dv = Binary.toDataView(buffer)
  dv.setBigInt64(247, BigInt(4_294_967_296))
  const checks = await invokeAllChecks({
    source: { buffer, dv },
    suite: manualHeaderSuite,
  })
  expect(findCheck(checks, 'legacyPointCountByReturn')).toHaveProperty(
    'status',
    'pass',
  )
})
