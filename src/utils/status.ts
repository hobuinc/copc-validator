import { Check } from 'types'

export const Statuses = {
  moreInfoOnFullScan: 'Run a Full Scan for more information',
  success: { status: 'pass' } as Check.Status,
  failure: { status: 'fail' } as Check.Status,
  successWithInfo: (info: string) => ({ status: 'pass', info } as Check.Status),
  failureWithInfo: (info: string) => ({ status: 'fail', info } as Check.Status),
  warningWithInfo: (info: string) => ({ status: 'warn', info } as Check.Status),
}
