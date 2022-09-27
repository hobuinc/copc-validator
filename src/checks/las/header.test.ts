import { ellipsoidFiles } from 'test'
import header from './header'
import { Binary, Getter, Las } from 'copc'

const filename = ellipsoidFiles.laz14

test.todo('header info')
// test('header info', async () => {
//   const lasHeader = Las.Header.parse(
//     await Getter.create(filename)(0, Las.Constants.minHeaderLength),
//   )
//   const get = Getter.create(filename)
//   const checks = mapChecks<Binary>(await get(0, Infinity), header)

//   expect(checks.find((c) => c.id === 'header')!.info).toEqual(lasHeader)
// })
