// import {
//   CopcCollection,
//   GetterCollection,
//   invokeCollection,
//   LasCollection,
// } from 'checks'
import {
  CopcCollection,
  LasCopcCollection,
  FallbackCollection,
} from 'collections'
import { invokeCollection } from 'utils'
import { Copc, Getter, Las } from 'copc'
import { Report } from 'types'
import { isEqual, omit } from 'lodash'

/**
 * Main function for scanning a given file. Attempts to use `copc.js` parse functions
 * to understand the type of file, then runs the corresponding Check.Suite to gain
 * a deeper understanding and validation of the filetype.
 * Can run `shallow` or `deep` scans, which means checking the first point of each
 * node versus checking every point of each node, respectively.
 * @param source Source string for Copc/Las file. Can be a file path or URL
 * @param {Report.Options} options Object containing optional values for `name: string`
 * and/or `deep: boolean`, to name the report and run a deep scan, respectively.
 * If `name` is omitted, the report name will be the value of `source`.
 * If `deep` is `true`, the report will scan every point of each node. If `false`,
 *  the report will scan the root (first) point of each node. Default: `false`
 * @returns {Promise<Report>} `Report` object detailing the filetype, checks completed,
 * and some additional information parsed from the file that may be useful
 */
export const generateReport = async (
  source: string,
  { name = source, deep = false, maxThreads, mini = false }: Report.Options,
): Promise<Report> => {
  const type = deep ? 'deep' : 'shallow'
  const start = new Date()
  const startTime = performance.now()
  // Getter.create() should never throw error outside of bad string
  const get = Getter.create(source)
  try {
    // Attempt Copc.create()
    const copc = await Copc.create(get)
    // Copc.create() can fail for the following reasons:
    //   - Las.Header.parse() throws an error (see below, 58)
    //   - Las.Vlr.walk() throws an error (see below, 64)
    //   - copc info VLR is missing
    //   - Corrupt/bad binary data

    // Copc.create() passed, probably valid COPC
    // need to perform additional checks to confirm

    const checks = await invokeCollection(
      CopcCollection({ filepath: source, get, copc, deep, maxThreads }),
    ) // no need to await CopcCollection since invokeCollection allows promises

    return {
      name,
      scan: {
        type,
        filetype: 'COPC',
        start,
        end: new Date(),
        time: performance.now() - startTime,
      },
      checks,
      copc: mini ? undefined : copc,
    }
  } catch (copcError) {
    //throw copcError
    // Copc.create() failed, definitely not valid COPC...
    // Check file with Las functions to determine why Copc.create() failed
    // TODO: if Error is 'no such file or directory', no need to attempt LasParse
    try {
      const header = Las.Header.parse(
        await get(0, Las.Constants.minHeaderLength),
      )
      // Las.Header.parse() can fail for the following reasons:
      //   - buffer.byteLength < minHeaderLength (375)
      //   - fileSignature (first 4 bytes) !== 'LASF'
      //   - majorVersion !== 1 || minorVersion !== 2 | 4
      //   - Corrupt/bad binary data
      const vlrs = await Las.Vlr.walk(get, header)
      // Las.Vlr.walk() can fail for the following reasons:
      //   - vlrHeaderLength !== 54
      //   - evlrHeaderLength !== 60
      //   - Corrupt/bad binary data
      const checks = await invokeCollection(
        LasCopcCollection({ get, header, vlrs }),
      )

      return {
        name,
        scan: {
          type,
          filetype: 'LAS',
          start,
          end: new Date(),
          time: performance.now() - startTime,
        },
        checks,
        las: mini ? undefined : { header, vlrs },
        copcError: copcError,
      }
    } catch (lasError) {
      // Las.* functions failed, try poking around manually with the Getter
      // to determine why Las failed to initialize

      // Should only need to check for the possibilities above (lines 58 & 64),
      // otherwise the Las suite would be running instead
      const checks = await invokeCollection(FallbackCollection(get))
      // TODO: Figure out a way to test this function (need specific bad file)
      const errors = (() =>
        isEqual(
          omit(lasError as Error, 'trace'),
          omit(copcError as Error, 'trace'),
        )
          ? { error: copcError as Error }
          : { error: lasError as Error, copcError: copcError as Error })()
      return {
        name,
        scan: {
          type,
          filetype: 'Unknown',
          start,
          end: new Date(),
          time: performance.now() - startTime,
        },
        checks,
        ...errors,
      }
    }
  }
}

export default generateReport

// Original version of the function before `deep` vs `shallow` was built into
// the CopcSuite. May still be useful so I'll keep it here
/*
export const generateCustomReport = async (
  source: string,
  copcSuite: Check.Suite<copcWithGetter>,
  lasSuite: Check.Suite<{ get: Getter; header: Las.Header; vlrs: Las.Vlr[] }>,
  getterSuite: Check.Suite<Getter>,
  { name, type }: Report.old_Options,
): Promise<Report> => {
  const start = new Date()
  const startTime = performance.now()
  const get = Getter.create(source)
  try {
    const copc = await Copc.create(get)

    const checks = await invokeAllChecks({
      source: { get, copc },
      suite: copcSuite,
    })

    return {
      name,
      scan: {
        type,
        filetype: 'COPC',
        start,
        end: new Date(),
        time: performance.now() - startTime,
      },
      checks,
      copc,
    }
  } catch (copcError) {
    try {
      const header = Las.Header.parse(
        await get(0, Las.Constants.minHeaderLength),
      )
      const vlrs = await Las.Vlr.walk(get, header)
      const checks = await invokeAllChecks({
        source: { get, header, vlrs },
        suite: lasSuite,
      })
      return {
        name,
        scan: {
          type,
          filetype: 'LAS',
          // result: resultFromChecks(checks),
          start,
          end: new Date(),
          time: performance.now() - startTime,
        },
        checks,
        las: {
          header,
          vlrs,
        },
        copcError: copcError as Error,
      }
    } catch (lasError) {
      const checks = await invokeAllChecks({
        source: get,
        suite: getterSuite,
      })
      const errors = (() =>
        isEqual(
          omit(lasError as Error, 'trace'),
          omit(copcError as Error, 'trace'),
        )
          ? { error: copcError as Error }
          : { error: lasError as Error, copcError: copcError as Error })()
      return {
        name,
        scan: {
          type,
          filetype: 'Unknown',
          start,
          end: new Date(),
          time: performance.now() - startTime,
        },
        checks,
        ...errors,
      }
    }
  }
}
*/
