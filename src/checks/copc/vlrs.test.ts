import { ellipsoidFiles } from 'test'
import { Copc, Getter } from 'copc'
import vlrs, * as Vlrs from './vlrs'
import { invokeAllChecks } from 'checks'
// import { mapChecks } from 'checks'

const filename = ellipsoidFiles.copc
const get = Getter.create(filename)

test('vlrs all-pass', async () => {
  const copc = await Copc.create(get)
  const checks = await invokeAllChecks([{ source: copc, suite: vlrs }])
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
})

test('vlrs utilities', async () => {
  const { vlrs } = await Copc.create(get)
  const vlrsMinusCopcInfo = Vlrs.removeVlr(vlrs, 'copc', 1)
  expect(vlrsMinusCopcInfo).not.toContainEqual({
    userId: 'copc',
    recordId: 1,
    contentOffset: 429,
    contentLength: 160,
    description: 'COPC info VLR',
    isExtended: false,
  })
  expect(vlrsMinusCopcInfo).toContainEqual({
    userId: 'copc',
    recordId: 1000,
    contentOffset: 1184242,
    contentLength: 160,
    description: 'EPT Hierarchy',
    isExtended: true,
  })
  expect(Vlrs.checkVlrDuplicates(vlrs, 'copc', 1)).toBe(false)
  const vlrsPlusDupedCopcInfo = [
    ...vlrs,
    {
      userId: 'copc',
      recordId: 1,
      contentOffset: 429,
      contentLength: 160,
      description: 'COPC info VLR',
      isExtended: false,
    },
  ]
  expect(Vlrs.checkVlrDuplicates(vlrsPlusDupedCopcInfo, 'copc', 1)).toBe(true)
})

// test('vlrs missing-required', async () => {
//   const copc = await Copc.create(filename)
//   const badCopc = {
//     ...copc,
//     header: {
//       ...copc.header,
//       vlrCount: 1,
//     },
//     vlrs: copc.vlrs.filter((v) => v.userId !== 'copc'),
//   }
//   const checks = mapChecks(badCopc, vlrs)

//   expect(checks.find((c) => c.id.includes('copc-info'))).toHaveProperty(
//     'status',
//     'fail',
//   )
//   expect(checks.find((c) => c.id.includes('copc-hierarchy'))).toHaveProperty(
//     'status',
//     'fail',
//   )
// })

// test('vlrs missing-recommended', async () => {
//   const copc = await Copc.create(filename)
//   const badCopc = {
//     ...copc,
//     header: {
//       ...copc.header,
//       vlrCount: 2,
//     },
//     vlrs: copc.vlrs.filter((v) => v.userId !== 'laszip encoded'),
//   }
//   const checks = mapChecks(badCopc, vlrs)

//   expect(checks.find((c) => c.id.includes('laszip-encoded'))).toHaveProperty(
//     'status',
//     'warn',
//   )
// })

test.todo('vlr negative tests')
