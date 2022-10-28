import { Copc } from 'copc'
import { ellipsoidFiles, getCopcItems } from 'test'
import { Check } from 'types'
import { checkAll, findCheck, getCheckIds, invokeAllChecks } from 'utils'
import { copcSuite } from './copc'
import headerSuite from './header'
import vlrSuite from './vlrs'

const items = getCopcItems()

const duplicatedTests = Object.keys(headerSuite).concat(Object.keys(vlrSuite))
const Suite: Check.Suite<Copc> = Object.fromEntries(
  Object.entries(copcSuite).filter(([id, _f]) => !duplicatedTests.includes(id)),
) // removing headerSuite and vlrSuite since they've got their own suites

test('copcSuite all-pass', async () => {
  const { copc } = await items
  const checks = await invokeAllChecks({ source: copc, suite: Suite })
  checkAll(checks)
})

test('copcSuite failure', async () => {
  const checks = await invokeAllChecks({ source: {} as Copc, suite: Suite })
  checkAll(checks, false)
})

test('copcSuite branch-coverage', async () => {
  const { copc } = await getCopcItems(ellipsoidFiles.color12)
  // undoing the bounds within cube rounding fix
  const badCopc = {
    ...copc,
    header: {
      ...copc.header,
      min: [
        copc.header.min[0],
        copc.header.min[1],
        copc.header.min[2] - copc.header.scale[2],
      ],
    },
  }
  const checks = await invokeAllChecks({ source: badCopc, suite: Suite })

  const boundWithinCube = findCheck(checks, 'bounds within cube')
  expect(boundWithinCube).toHaveProperty('status', 'fail')
  expect(boundWithinCube).toHaveProperty(
    'info',
    'Las bound(s) falls outside of Copc cube: Z',
  )
})
