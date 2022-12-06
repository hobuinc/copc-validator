import { Copc } from 'copc'
import { Check } from '../types/index.js'
import { Statuses } from '../utils/index.js'
import { headerSuite } from './header.js'
import { vlrSuite } from './vlrs.js'

/**
 * Suite of Check Function for checking the `Copc` object to validate a `copc.laz`
 * file. The `headerSuite` and `vlrSuite` Suites are written to use the `Copc`
 * object as a parameter so that they can be copied here, so this Suite is for
 * Functions that require other parameters destructured from the `Copc` object
 */
export const copcSuite: Check.Suite<Copc> = {
  ...headerSuite,
  ...vlrSuite,
  'bounds within cube': ({ info: { cube }, header: { min, max, scale } }) => {
    const badBounds = min.reduce<string[]>(
      (prev, minValue, idx) =>
        cube[idx] - scale[idx] <= minValue &&
        max[idx] <= cube[idx + 3] + scale[idx]
          ? [...prev]
          : [...prev, PointIdx[idx]],
      [],
    )
    if (badBounds.length > 0)
      return Statuses.failureWithInfo(
        `Las bound(s) falls outside of Copc cube: ${badBounds}`,
      )
    return Statuses.success
  },
}

const PointIdx = ['X', 'Y', 'Z']
