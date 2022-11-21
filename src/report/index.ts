import {
  CopcCollection,
  LasCopcCollection,
  FallbackCollection,
} from '../collections/index.js'
import { invokeCollection, currTime } from '../utils/index.js'
import { Copc, Getter, Las } from 'copc'
import { Check, generateReportParams, Report } from '../types/index.js'
import isEqual from 'lodash.isequal'
import omit from 'lodash.omit'

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
  {
    source,
    options: {
      name = source,
      deep = false,
      workers,
      mini = false,
      showProgress = false,
    },
  }: generateReportParams,
  collections: {
    copc: Check.CollectionFn
    las: Check.CollectionFn
    fallback: Check.CollectionFn
  } = {
    copc: CopcCollection,
    las: LasCopcCollection,
    fallback: FallbackCollection,
  },
): Promise<Report> => {
  const type = deep ? 'deep' : 'shallow'
  const start = new Date()
  const startTime = currTime()
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
      collections.copc({
        filepath: source,
        get,
        copc,
        deep,
        workerCount: workers,
        showProgress,
      }),
    ) // no need to await CopcCollection since invokeCollection allows promises

    return {
      name,
      scan: {
        type,
        filetype: 'COPC',
        start,
        end: new Date(),
        time: /*performance.now()*/ currTime() - startTime,
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
        collections.las({ get, header, vlrs }),
      )

      return {
        name,
        scan: {
          type,
          filetype: 'LAS',
          start,
          end: new Date(),
          time: currTime() - startTime,
        },
        checks,
        las: mini ? undefined : { header, vlrs },
        error: {
          message: (copcError as Error).message,
          stack: (copcError as Error).stack,
        },
      }
    } catch (lasError) {
      // Las.* functions failed, try poking around manually with the Getter
      // to determine why Las failed to initialize

      // Should only need to check for the possibilities above (lines 58 & 64),
      // otherwise the Las suite would be running instead
      const checks = await invokeCollection(collections.fallback(get))
      // TODO: Figure out a way to test this function (need specific bad file)
      const errors = (() =>
        isEqual(
          omit(lasError as Error, 'stack'),
          omit(copcError as Error, 'stack'),
        )
          ? {
              error: {
                message: (copcError as Error).message,
                stack: (copcError as Error).stack,
              },
            }
          : {
              error: {
                message: (lasError as Error).message,
                stack: (lasError as Error).stack,
              },
              copcError: {
                message: (copcError as Error).message,
                stack: (copcError as Error).stack,
              },
            })()
      return {
        name,
        scan: {
          type,
          filetype: 'Unknown',
          start,
          end: new Date(),
          time: currTime() - startTime,
        },
        checks,
        ...errors,
      }
    }
  }
}

export default generateReport
