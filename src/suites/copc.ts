import { Bounds, Copc, Las } from 'copc'
import { Check } from 'types'
import { Statuses } from 'utils'
import headerSuite from './header'
import vlrSuite from './vlrs'

export const copcSuite: Check.Suite<Copc> = {
  ...headerSuite,
  ...vlrSuite,
  'cube within bounds': ({ info: { cube }, header: { min, max } }) => {
    const mid = Bounds.mid(cube)
    const withinHeader = mid.map(
      (p, i) => p > min[i] && p < max[i],
    ) as pointCheck // true means good point, false means bad point
    const bad = withinHeader.reduce<number[]>(
      (prev, bool, idx) => (bool ? [...prev] : [...prev, idx]),
      [],
    ) // turn [bool, bool, bool] into [!bool && 0, !bool && 1, !bool && 2]
    // e.g.  [true, true, true] => []    [false, true, false] => [0,2]
    if (bad.length > 0)
      return Statuses.failureWithInfo(
        `COPC cube midpoint${
          bad.length > 1 ? 's' : ''
        } outside of Las Bounds: ${bad.map((i) => PointIdx[i])}`,
      )
    return Statuses.success
  },
}

type pointCheck = [boolean, boolean, boolean]
const PointIdx = ['X', 'Y', 'Z']
