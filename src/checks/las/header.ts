import { Las, Getter, Binary } from 'copc'
import { Check } from 'types'

export const header: Check.Group<Binary> = {
  header: (s) => {
    try {
      const header = Las.Header.parse(s)
      return { status: 'pass', info: header }
    } catch (e) {
      return { status: 'fail', info: e }
    }
  },
}

export default header
