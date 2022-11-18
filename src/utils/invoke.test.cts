global.performance = undefined as unknown as Performance
import { now } from './invoke'

test('now', () => {
  expect(now()).toBeCloseTo(new Date().getTime(), -2)
})
