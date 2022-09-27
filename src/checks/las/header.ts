import { Las, Binary } from 'copc'
import { Check } from 'types'

// export const header: Check.SyncGroup<Binary> = {
//   header: (s) => {
//     try {
//       Las.Header.parse(s)
//       return true //{ status: 'pass', info: header }
//     } catch (e) {
//       return { status: 'fail', info: e as Error }
//     }
//   },
// }

export const header: Check.Suite<Binary> = {}

export default header
