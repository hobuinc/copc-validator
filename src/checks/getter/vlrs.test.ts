import { Getter } from 'copc'
import { getLasItems, ellipsoidFiles } from 'test'
import { invokeAllChecks, getterToHeader } from 'checks'
import vlrSuite from './vlrs'
import generalVlrSuite from 'checks/las/vlrs'

const get = Getter.create(ellipsoidFiles.laz14)
const badGet = Getter.create(ellipsoidFiles.fake)

test('getter vlrs all-expected', async () => {
  const { header, vlrs } = await getLasItems()
  const { info } = await getterToHeader(get)
  const checks = await invokeAllChecks({
    source: { get, info },
    suite: vlrSuite,
  })
  expect(checks).toEqual(
    await invokeAllChecks({ source: { header, vlrs }, suite: generalVlrSuite }),
  )
})

test('getter vlrs failures', async () => {
  const { info } = await getterToHeader(badGet)
  const checks = await invokeAllChecks({
    source: { get: badGet, info },
    suite: vlrSuite,
  })
  expect(checks).toEqual([
    { id: 'vlrWalkTest', status: 'fail', info: expect.any(String) },
  ])
})
