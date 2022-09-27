import { Binary, Copc, Getter, Las } from 'copc'
import { Check, Report } from 'types'
import { generateChecks } from '../checks'

export const generateReport = async (
  source: string,
  copcChecks: Check.Groups<Copc>,
  lasChecks: Check.Groups<Binary>,
  options: Report.Options,
): Promise<Report> => {
  const start = new Date()
  const name = options.name
  try {
    // Attempt COPC parse
    const copc = await Copc.create(source)
    const checks = generateChecks(copc, copcChecks)
    const { header, vlrs, info, wkt } = copc
    return {
      name,
      scan: {
        type: options.type,
        result: 'COPC',
        start,
        end: new Date(),
      },
      checks,
      copc: {
        header,
        vlrs,
        info,
        wkt,
      },
    }
  } catch (error) {
    // COPC fail...
    try {
      // Attempt LAS parse
      const get = Getter.create(source)
      const header = Las.Header.parse(
        await get(0, Las.Constants.minHeaderLength),
      )
      const vlrs = await Las.Vlr.walk(get, header)
      const checks = generateChecks(await get(0, Infinity), lasChecks)
      return {
        name,
        scan: {
          type: options.type,
          result: 'LAS',
          start,
          end: new Date(),
        },
        checks,
        las: {
          header,
          vlrs,
        },
      }
    } catch (e) {
      // LAS fail...
      return {
        // Unable to determine file information
        name,
        scan: {
          type: options.type,
          result: 'Unknown',
          start,
          end: new Date(),
        },
        checks: [],
        error: e as Error,
      }
    }
  }
}
