import { getCopcItems } from 'test'
import { invokeAllChecks } from 'checks'
import vlrs from 'checks/vlrs'

const items = getCopcItems()

test('copc vlrs all-pass', async () => {
  const { copc } = await items
  const checks = await invokeAllChecks({ source: copc, suite: vlrs })
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})

test('copc vlrs failures', async () => {
  const { copc } = await items

  const emptyVlrChecks = await invokeAllChecks({
    source: {
      ...copc,
      vlrs: [],
    },
    suite: vlrs,
  })
  emptyVlrChecks.forEach((check) =>
    expect(check).not.toHaveProperty('status', 'pass'),
  )

  const doubleVlrChecks = await invokeAllChecks({
    source: {
      ...copc,
      vlrs: copc.vlrs.concat(copc.vlrs),
    },
    suite: vlrs,
  })
  doubleVlrChecks.forEach((check) =>
    expect(check).not.toHaveProperty('status', 'pass'),
  )
})

test.todo('other copc vlrs tests')
