import {
  CopcCollection,
  LasCopcCollection,
  FallbackCollection,
  // LasDirectCollection,
} from '../collections/index.js'
import {
  invokeCollection,
  currTime,
  loadAllHierarchyPages,
} from '../utils/index.js'
import { Copc, Getter, Las } from 'copc'
import { Report } from '../types/index.js'
import isEqual from 'lodash.isequal'
import omit from 'lodash.omit'
import { headerToMetadata, Metadata } from './format.js'

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
export const generateReport = async ({
  source,
  options = defaultOptions,
  collections = defaultCollections,
}: generateReportParams): Promise<Report> => {
  // Options setup
  const { deep, mini, pdal, worker, workers, queueLimit, showProgress } =
    options
  // if(sampleSize)
  //   console.warn('')
  let { name, sampleSize } = options
  if (typeof name === 'undefined')
    name = typeof source === 'string' ? source : defaultOptions.name
  let type = deep ? 'deep' : 'shallow'
  const start = new Date()
  const startTime = currTime()

  // Getter.create() should never throw error outside of bad string
  const get =
    typeof source === 'string'
      ? Getter.create(source)
      : async (b: number, e: number) =>
          new Uint8Array(await source.slice(b, e).arrayBuffer())

  try {
    // Attempt Copc.create()
    const copc = await Copc.create(get)
    // Copc.create() can fail for the following reasons:
    //   - Las.Header.parse() throws an error (see below, 91)
    //   - Las.Vlr.walk() throws an error (see below, 97)
    //   - copc info VLR is missing
    //   - Corrupt/bad binary data

    // Copc.create() passed, probably valid COPC
    // need to perform additional checks to confirm

    const checks = await invokeCollection(
      collections.copc({
        file: source,
        get,
        copc,
        showProgress,
        deep,
        worker,
        workerCount: workers,
        queueLimit,
        sampleSize,
      }),
    )
    if (sampleSize) {
      const nodeCount = Object.entries(
        await loadAllHierarchyPages(get, copc),
      ).length
      if (sampleSize < nodeCount) {
        if (sampleSize < 1) sampleSize = 1
        type = `${type}-${sampleSize}/${nodeCount}`
      }
    }

    const data = await (async () => {
      const o: { copc?: Copc; pdal?: { metadata: Metadata } } = {}
      if (!mini) o.copc = copc
      if (pdal) o.pdal = await headerToMetadata({ ...copc, get })
      return o
    })()
    return {
      name,
      scan: {
        type,
        filetype: 'COPC',
        start,
        end: new Date(),
        time: currTime() - startTime,
      },
      checks,
      ...data,
      // copc: mini ? undefined : copc,
      // pdal: pdal ? await headerToMetadata({ ...copc, get }) : undefined,
    }
  } catch (copcError) {
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
      //   - any vlrHeaderLength !== 54
      //   - any evlrHeaderLength !== 60
      //   - Corrupt/bad binary data

      const checks = await invokeCollection(
        collections.las({ get, header, vlrs }),
      )
      const data = await (async () => {
        const o: {
          las?: { header: Las.Header; vlrs: Las.Vlr[] }
          pdal?: { metadata: Metadata }
        } = {}
        if (!mini) o.las = { header, vlrs }
        if (pdal) o.pdal = await headerToMetadata({ header, vlrs, get })
        return o
      })()

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
        ...data,
        // las: mini ? undefined : { header, vlrs },
        // pdal: pdal ? await headerToMetadata({ header, vlrs, get }) : undefined,
        error: {
          message: (copcError as Error).message,
          stack: (copcError as Error).stack,
        },
      }
    } catch (lasError) {
      // Las.* functions failed, try poking around manually with the Getter
      // to determine why Las failed to initialize

      // Should only need to check for the possibilities above (lines 91 & 97),
      // otherwise the Las suite would be running instead

      const checks = await invokeCollection(collections.fallback(get))
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
        ...compareErrors(copcError, lasError),
        // ...errors,
      }
    }
  }
}

type generateReportParams = {
  source: string | File
  options?: Report.Options
  collections?: Collections
}
const defaultOptions = {
  name: 'COPC Validator Report',
  deep: false,
  mini: false,
  pdal: false,
  worker: undefined,
  workers: undefined,
  queueLimit: undefined,
  sampleSize: undefined,
  showProgress: false,
}
type Collections = {
  copc: typeof CopcCollection /*Check.CollectionFn*/
  las: typeof LasCopcCollection /*Check.CollectionFn*/
  // lasDirect: typeof LasDirectCollection
  fallback: typeof FallbackCollection /*Check.CollectionFn*/
}
const defaultCollections: Collections = {
  copc: CopcCollection,
  las: LasCopcCollection,
  // lasDirect: LasDirectCollection,
  fallback: FallbackCollection,
}

// TODO: Figure out a way to test this function (need specific bad file)
const compareErrors = (copcError: unknown, lasError: unknown) =>
  isEqual(omit(copcError as Error, 'stack'), omit(lasError as Error, 'stack'))
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
      }
