import { Getter } from 'copc'
import { getLasItems, ellipsoidFiles } from 'test'
import { invokeAllChecks, getterToHeader, findCheck } from 'checks'
import vlrSourcer, { manualVlrSuite } from './vlrs'
import generalVlrSuite from 'checks/las/vlrs'

const get = Getter.create(ellipsoidFiles.laz14)
const badGet = Getter.create(ellipsoidFiles.fake)

test('getter vlrs all-expected', async () => {
  const { header, vlrs } = await getLasItems()

  const checks = await invokeAllChecks(await vlrSourcer(get))
  expect(checks).toEqual(
    await invokeAllChecks({ source: { header, vlrs }, suite: generalVlrSuite }),
  )
})

test('getter vlrs failures', async () => {
  await expect(vlrSourcer(badGet)).rejects.toThrow('Invalid VLR header length')

  const { get, header, vlrs } = await getLasItems()
  const suite = manualVlrSuite

  const emptyVlrChecks = await invokeAllChecks({
    source: { get, vlrs: [] },
    suite,
  })
  expect(findCheck(emptyVlrChecks, 'wkt')).toHaveProperty(
    'info',
    'Failed to find WKT SRS VLR',
  )

  // TODO: Check for preference of [...vlrs, ...vlrs] or vlrs.concat(vlrs)
  const doubleVlrChecks = await invokeAllChecks({
    source: { get, vlrs: [...vlrs, ...vlrs] },
    suite,
  })
  expect(doubleVlrChecks).toEqual([
    { id: 'wkt', status: 'fail', info: 'Found multiple WKT SRS VLRs' },
  ])
})
