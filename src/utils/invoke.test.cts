global.performance = undefined as unknown as Performance
import { currTime } from './invoke'

test('now', () => {
  expect(currTime()).toBeCloseTo(new Date().getTime(), -2)
})
