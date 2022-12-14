import { headerSuite, vlrSuite } from 'suites'
import { getCopcItems } from 'test'
import { invokeAllChecks, invokeCollection } from 'utils'
import { FallbackCollection } from './fallback'

const items = getCopcItems()

test('FallbackCollection copc-data', async () => {
  // const get = Getter.create(ellipsoidFiles.copc)
  const {
    get,
    copc: { header, vlrs },
  } = await items
  const checks = await invokeCollection(FallbackCollection(get))
  expect(checks).toEqual(
    await invokeAllChecks([
      { source: header, suite: headerSuite },
      { source: { header, vlrs }, suite: vlrSuite },
    ]),
  )
  //checkAll(checks)
})
