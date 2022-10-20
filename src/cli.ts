import minimist from 'minimist'
import { generateReport } from 'report'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

export const fs = { writeFileSync }

/** CLI Usage:
 * ```
 * copcc {--deep} {--mini} {--name: string} {--output: string} {--threads: number} [file]
 * ```
 *
 * `deep` | `d`: Runs a Deep Scan, checking every point in a PDR (if valid copc/las) for
 * data that may violate the COPC spec.  *Optional - runs Shallow scan if omitted*
 *
 * `output` | `o`: A path to an output file for copcc to write the report to.
 *                                       *Optional - writes to stdout if omitted*
 *
 * `name` | `n`: Name for the report.    *Optional - uses filename if omitted*
 *
 * `threads` | `t`: Max Thread count to pass to Piscina, for scanning nodes (checks/copc/nodes.ts)
 *                                       *Optional - based on CPU if omitted*
 *
 * `mini` | `m`: Outputs a minified version of the report without Copc/Las data (checks & scan only)
 *                                       *Optional - included extended copc.js data if omitted*
 *
 * TODO: `las`: Skip attempting to validate as COPC and just validate the LAS specs
 *                                       *Optional - attempts Copc first if omitted*
 *
 * `file`: A file path (local or URL) to run the validation checks against  *Required*
 */
export const copcc = async (argv: string[]) => {
  if (argv === undefined || argv.length < 1)
    throw new Error('Not enough argument(s) provided')

  // PARSE ARGS
  const args = minimist<ExpectedArgv>(argv, {
    boolean: ['deep', 'mini', 'help'],
    string: ['output', 'name'],
    alias: {
      output: 'o',
      deep: 'd',
      name: 'n',
      threads: 't',
      mini: 'm',
      help: 'h',
    },
  })
  const {
    help,
    _: [file, ...rest],
    deep,
    output,
    name: givenName,
    threads,
    mini,
  } = args

  if (help) {
    // process.stdout.write(helpString)
    process.stdout.write(writeHelp)
    return
  }

  // VALIDATE ARGS
  if (!file) throw new Error('Must provide a filepath to be validated')
  if (rest.length > 0)
    throw new Error('Too many arguments (filepaths) provided')

  const name = givenName || file

  // deep & output don't need validated because undefined/false is used in context

  // RUN SCAN
  const start = performance.now()
  const report = await generateReport(file, {
    name,
    deep,
    maxThreads: threads,
    mini,
  })
  const end = performance.now()
  // Using performance.now() to print the time after the report, for debugging convienence

  // OUTPUT SCAN
  if (output) {
    const path = resolve(output)
    try {
      fs.writeFileSync(path, JSON.stringify(report, null, 2))
      console.log(`Report successfully written to: ${path}`)
    } catch (err) {
      console.error(err)
    }
  } else process.stdout.write(JSON.stringify(report, null, 2) + '\n') //console.dir(report, { depth: null })
  // console.dir prints entire report object & keeps VSCode syntax highlighting
  // but process.stdout.write() may be preferred? will check with Connor
  // currently using process.stdout.write() so the shape of the output
  // (newlines, undefined, etc) matches the output file
  console.log(`Scan time: ${end - start}ms`)
  return
}

export default copcc

type ExpectedArgv = {
  _: string[]
  help: boolean
  h: boolean //alias
  deep: boolean
  d: boolean //alias
  mini: boolean
  m: boolean //alias
  output?: string
  o?: string //alias
  name?: string
  n?: string //alias
  threads?: number
  t?: number //alias
}

type flag = { flag: string; description: string; default?: string }
const flags: flag[] = [
  {
    flag: '-n, --name',
    description: 'Title for report output',
    default: '<path>',
  },
  {
    flag: '-o, --output',
    description: 'Path to write report as JSON file',
    default: 'stdout',
  },
  {
    flag: '-m, --mini',
    description: 'Omit extended COPC/LAS info from report',
    default: 'false',
  },
  {
    flag: '-d, --deep',
    description: 'Scan all (versus root) points of each node',
    default: 'false',
  },
  {
    flag: '-t, --threads',
    description: 'Max thread count for scanning Hierarchy Nodes',
    default: 'CPU-based',
  },
  { flag: '-h, --help', description: 'Output this help information' },
]

const space = (n: number) => Array(n > 0 ? n + 1 : 1).join(' ')
export const writeHelp = ((f: flag[]) => {
  const columns = process.stdout.columns > 180 ? 180 : process.stdout.columns
  let header = `
   Usage: copcc [options] <path>   

   Scans a COPC/LAS file to verify the data matches the filetype specifications.

   Options:${space(columns - 26)}*all optional*

`
  const longestDefault: number = f.reduce((prev, curr) => {
    if (curr.default && curr.default.length > prev) return curr.default.length
    return prev
  }, 0)

  // option line:
  // ( ) = hardcoded space      [ ] = variable space
  //(   )-x, --xxx[     ]blah blah blah description[     ](default: )[]xxxxx( )
  // 3 + flag.length + X + description.length + Y + 9 + Z + default.length + 1 = 180 columns
  f.forEach(({ flag, description, default: d }) => {
    const row = `   ${flag}${space(17 - flag.length)}${description} ${space(
      columns - 40 - description.length,
    )}${d ? `default: ${space(longestDefault - d.length)}${d}` : ''} `
    header += row + '\n'
  })
  return header
})(flags)
