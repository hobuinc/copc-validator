import { Copc } from 'copc'
import { ellipsoidFilename } from 'test'
import header from './header'
import { mapChecks } from './common'

const filename = ellipsoidFilename

test('header all-pass', async () => {
  const copc = await Copc.create(filename)
  const checks = mapChecks(copc, header)

  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})
