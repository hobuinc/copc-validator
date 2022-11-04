// doing all this gross stuff for ~1% Total Funcs coverage
global = { ...global, performance: undefined as unknown as Performance }
import { now } from './invoke'

test('now', () => {
  expect(now()).toBeCloseTo(new Date().getTime(), -1)
})
// and now() became gross when I decided to leave Node.JS 14.x in the GH Action
