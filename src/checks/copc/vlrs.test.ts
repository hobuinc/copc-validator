import { ellipsoidFiles } from 'test'
import { Copc, Getter } from 'copc'
import vlrs from './vlrs'
import { invokeAllChecks } from 'checks'

const filename = ellipsoidFiles.copc
const get = Getter.create(filename)

test('copc vlrs all-pass', async () => {
  const copc = await Copc.create(get)
  const checks = await invokeAllChecks({ source: copc, suite: vlrs })
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})

test('copc vlrs failures', async () => {
  const copc = await Copc.create(get)
  const emptyVlrCopc: Copc = {
    ...copc,
    vlrs: [],
  }
  const emptyVlrChecks = await invokeAllChecks({
    source: emptyVlrCopc,
    suite: vlrs,
  })
  emptyVlrChecks.forEach((check) =>
    expect(check).not.toHaveProperty('status', 'pass'),
  )

  const doubleVlrCopc = {
    ...copc,
    vlrs: copc.vlrs.concat(copc.vlrs),
  }
  const doubleVlrChecks = await invokeAllChecks({
    source: doubleVlrCopc,
    suite: vlrs,
  })
  doubleVlrChecks.forEach((check) =>
    expect(check).not.toHaveProperty('status', 'pass'),
  )
})

test.todo('other copc vlrs tests')
