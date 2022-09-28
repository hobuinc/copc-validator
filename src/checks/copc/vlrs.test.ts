import { ellipsoidFiles } from 'test'
import { Copc, Getter } from 'copc'
import vlrs from './vlrs'
import { invokeAllChecks } from 'checks'
// import { mapChecks } from 'checks'

const filename = ellipsoidFiles.copc
const get = Getter.create(filename)

test('vlrs all-pass', async () => {
  const copc = await Copc.create(get)
  const checks = await invokeAllChecks([{ source: copc, suite: vlrs }])
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
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
