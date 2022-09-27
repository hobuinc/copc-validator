import { Copc } from 'copc'
import { ellipsoidFilename } from 'test'
import { mapChecks } from 'checks'
import info from './info'

const filename = ellipsoidFilename

test('info all-pass', async () => {
  const copc = await Copc.create(filename)
  const checks = mapChecks(copc, info)

  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})

test('info.gpsTimeRange fail', async () => {
  const copc = await Copc.create(filename)
  const badCopc: Copc = {
    ...copc,
    info: {
      ...copc.info,
      gpsTimeRange: [copc.info.gpsTimeRange[1] + 1, copc.info.gpsTimeRange[1]],
    },
  }
  const checks = mapChecks(badCopc, info)

  expect(checks.find((c) => c.id.includes('gpsTimeRange'))).toHaveProperty(
    'status',
    'fail',
  )
})
