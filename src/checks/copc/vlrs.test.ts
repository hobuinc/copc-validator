import { getCopcItems } from 'test'
import { invokeAllChecks } from 'checks'
import { vlrSuite } from 'checks/las'

// TESTING src/checks/vlrs.ts WITH COPC DATA

const items = getCopcItems()

test('copc vlrs all-pass', async () => {
  const { copc } = await items
  const checks = await invokeAllChecks({ source: copc, suite: vlrSuite })
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})

test('copc vlrs failures', async () => {
  const { copc } = await items

  const emptyVlrChecks = await invokeAllChecks({
    source: {
      ...copc,
      vlrs: [],
    },
    suite: vlrSuite,
  })
  emptyVlrChecks.forEach((check) =>
    expect(check).not.toHaveProperty('status', 'pass'),
  )

  const doubleVlrChecks = await invokeAllChecks({
    source: {
      ...copc,
      vlrs: copc.vlrs.concat(copc.vlrs),
    },
    suite: vlrSuite,
  })
  doubleVlrChecks.forEach((check) =>
    expect(check).not.toHaveProperty('status', 'pass'),
  )
})

test.todo('other copc vlrs tests')
