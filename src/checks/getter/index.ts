import { basicCheck, invokeAllChecks } from '../../checks'
import { Binary, Getter, Las } from 'copc'
import { Check } from 'types'
import headerSuite from './header'

export const GetterSuite: Check.Suite<Getter> = {
  header: async (get) =>
    invokeAllChecks({
      source: await get(0, Las.Constants.minHeaderLength),
      suite: headerSuite,
    }),
}
