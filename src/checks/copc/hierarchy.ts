import { Copc, Getter } from 'copc'
import { Check } from 'types'
import { HierarchyCheckParams } from './common'

export const hierarchy: Check.Suite<HierarchyCheckParams> = {
  hierarchy: async ({ get, copc }) => {
    const {
      info: { rootHierarchyPage },
    } = copc
    try {
      const hierarchy = await Copc.loadHierarchyPage(get, rootHierarchyPage)
      return { status: 'pass', info: hierarchy }
    } catch (e) {
      return { status: 'fail', info: e as Error }
    }
  },
}

export default hierarchy
