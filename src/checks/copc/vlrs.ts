import { Check } from 'types'
import { Copc, Las } from 'copc'
import {
  basicCheck,
  checkVlrDuplicates,
  Statuses,
  vlrCheck,
} from '../../checks'

const vlrs: Check.Suite<Copc> = {
  vlrCount: (c) =>
    basicCheck(c.vlrs.filter((v) => !v.isExtended).length, c.header.vlrCount),
  evlrCount: (c) =>
    basicCheck(c.vlrs.filter((v) => v.isExtended).length, c.header.evlrCount),
  // 'copc-info': (c) => {
  //   const vlr = Las.Vlr.find(c.vlrs, 'copc', 1)
  //   if (!vlr) return Messages.requiredVlrNotFound
  //   if (checkVlrDuplicates(c.vlrs, 'copc', 1))
  //     return Messages.multipleCopcVlrsFound('copc-info')
  //   return basicCheck(vlr, (v) => !v.isExtended && v.contentLength === 160)
  // },
  'copc-info': ({ vlrs }) =>
    vlrCheck(
      vlrs,
      'copc',
      1,
      true,
      (v) => !v.isExtended && v.contentLength === 160,
    ),
  // 'copc-hierarchy': (c) => {
  //   const vlr = Las.Vlr.find(c.vlrs, 'copc', 1000)
  //   if (!vlr) return Messages.requiredVlrNotFound
  //   if (checkVlrDuplicates(c.vlrs, 'copc', 1000))
  //     return Messages.multipleCopcVlrsFound('copc-hierarchy')
  //   return Statuses.success
  // },
  'copc-hierarchy': ({ vlrs }) => vlrCheck(vlrs, 'copc', 1000),
  // 'laszip-encoded': (c) => {
  //   const vlr = Las.Vlr.find(c.vlrs, 'laszip encoded', 22204)
  //   if (!vlr) return Messages.recommendedVlrNotFound
  //   if (checkVlrDuplicates(c.vlrs, 'laszip encoded', 22204))
  //     return Messages.multipleCopcVlrsFound('laszip encoded')
  //   return basicCheck(
  //     vlr,
  //     (v) => !v.isExtended && v.description === 'lazperf variant',
  //   )
  // },
  'laszip-encoded': ({ vlrs }) =>
    vlrCheck(vlrs, 'laszip encoded', 22204, false, (v) => !v.isExtended),
}

export default vlrs

// const Messages = {
//   // ...Statuses,
//   requiredVlrNotFound: Statuses.failureWithInfo('Failed to find VLR'),
//   recommendedVlrNotFound: Statuses.warningWithInfo(
//     'Failed to find VLR (Not required, but recommended)',
//   ),
//   multipleCopcVlrsFound: (name: string) =>
//     Statuses.failureWithInfo(`Found multiple ${name} VLRs`),
// }
