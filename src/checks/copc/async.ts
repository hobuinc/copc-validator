import { performCheckSync } from 'checks'
import { Copc, Getter } from 'copc'
import { map } from 'lodash'
import { Check } from 'types'
import header from './header'

export const async: Check.AsyncGroup<string | Getter> = {
  'copc parse': async (s) => {
    try {
      await Copc.create(s)
      return true
    } catch (e) {
      return { status: 'fail', info: e as Error }
    }
  },
  'validate copc values': async (s) => {
    try {
      const copc = await Copc.create(s)
      const headerChecks = map(header, (f, id) => performCheckSync(copc, f, id))
      return {
        status: headerChecks.every((c) => c.status === 'pass')
          ? 'pass'
          : 'fail',
        info: headerChecks,
      }
    } catch (e) {
      return { status: 'fail', info: e as Error }
    }
  },
}

export default async
