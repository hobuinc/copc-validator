import { Copc } from 'copc'
import { ellipsoidFiles } from 'test'
import async from './async'
import { mapAsyncChecks } from 'checks'
import { Check } from 'types'

const filename = ellipsoidFiles.copc

test('async all-pass', async () => {
  const checks: Check[] = await Promise.all(mapAsyncChecks(filename, async))

  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})
