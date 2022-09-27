import { Copc } from 'copc'
import { ellipsoidFiles } from 'test'
import header from './header'
import { mapChecks } from 'checks'

const filename = ellipsoidFiles.copc

test('header all-pass', async () => {
  const copc = await Copc.create(filename)
  const checks = mapChecks(copc, header)

  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})
