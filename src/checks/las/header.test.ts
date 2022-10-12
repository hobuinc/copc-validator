import headerSuite from './header'
import { Binary, Getter, Las } from 'copc'
import { getLasItems } from 'test'
import { findCheck, invokeAllChecks } from 'checks'

const items = getLasItems()

test('header all-pass', async () => {
  const { header } = await items
  const checks = await invokeAllChecks({ source: header, suite: headerSuite })
  checks.forEach((check) => expect(check).toHaveProperty('status', 'pass'))
  //expect(findCheck(checks, 'minorVersion')).toHaveProperty('status', 'fail')
})

test.todo('header info')
// test('header info', async () => {
//   const lasHeader = Las.Header.parse(
//     await Getter.create(filename)(0, Las.Constants.minHeaderLength),
//   )
//   const get = Getter.create(filename)
//   const checks = mapChecks<Binary>(await get(0, Infinity), header)

//   expect(checks.find((c) => c.id === 'header')!.info).toEqual(lasHeader)
// })
