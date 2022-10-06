import { invokeAllChecks } from 'checks'
import { Copc, Getter } from 'copc'
import { ellipsoidFiles } from 'test'
import { Check } from 'types'
import hierarchy from './hierarchy'

test('hierarchyNestedSuite failure', async () => {
  // supplying the hierarchy suite with non-copc data to force failure
  const checks = await invokeAllChecks({
    source: { get: Getter.create(ellipsoidFiles.laz14), copc: {} as Copc },
    suite: hierarchy,
  })
  expect(checks).toMatchObject<Check[]>([
    { id: 'hierarchyNestedSuite', status: 'fail' },
  ])
})
