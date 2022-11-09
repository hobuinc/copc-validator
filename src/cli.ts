import minimist from 'minimist'
import { generateReport } from 'report'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

export const fs = { writeFileSync }
const { version: copcVersion } = require('../package.json') //eslint-disable-line

// ========== OPTIONS HERE ==========
const flags: flag[] = [
  {
    flag: '-d, --deep',
    description: 'Scan all (versus root) points of each node',
    default: 'false',
  },
  {
    flag: '-w, --workers',
    description: 'Max thread count for scanning Hierarchy Nodes',
    default: 'CPU-count',
  },
  {
    flag: '-n, --name',
    description: 'Title for report output',
    default: '<path>',
  },
  {
    flag: '-m, --mini',
    description: 'Omit extended COPC/LAS info from report',
    default: 'false',
  },
  {
    flag: '-p, --progress',
    description: 'Show a progress bar while reading the point data',
    default: 'false',
  },
  {
    flag: '-o, --output',
    description: 'Path to write report as JSON file',
    default: 'stdout',
  },
  { flag: '-h, --help', description: 'Output this help information' },
  { flag: '-v, --version', description: 'Output copcc version' },
]
type ExpectedArgv = {
  _: string[]
  help: boolean
  h: boolean //alias
  version: boolean
  v: boolean //alias
  deep: boolean
  d: boolean //alias
  mini: boolean
  m: boolean //alias
  progress: boolean
  p: boolean //alias
  output?: string
  o?: string //alias
  name?: string
  n?: string //alias
  workers?: number
  w?: number //alias
}

// ========== MAIN CLI FUNCTION ==========
export const copcc = async (argv: string[]) => {
  if (argv === undefined || argv.length < 1)
    throw new Error('Not enough argument(s) provided')

  // PARSE ARGS
  const args = minimist<ExpectedArgv>(argv, {
    // ===== OPTIONS ALSO GO HERE =====
    boolean: ['deep', 'mini', 'progress', 'help', 'version'],
    string: ['output', 'name'],
    alias: {
      output: 'o',
      deep: 'd',
      name: 'n',
      workers: 'w',
      mini: 'm',
      help: 'h',
      version: 'v',
      progress: 'p',
    },
  })
  const {
    help,
    version,
    _: [file, ...rest],
    deep,
    output,
    name: givenName,
    workers,
    mini,
    progress,
  } = args

  if (help) {
    process.stdout.write(writeHelp(process.stdout.columns))
    return
  }
  if (version) {
    process.stdout.write(copcVersion + '\n')
    return
  }

  // VALIDATE ARGS
  if (!file) throw new Error('Must provide a filepath to be validated')
  if (rest.length > 0)
    throw new Error('Too many arguments (filepaths) provided')

  const name = givenName || file

  // RUN SCAN
  const report = await generateReport({
    source: file,
    options: {
      name,
      deep,
      workers,
      mini,
      showProgress: progress,
    },
  })

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
  return
}

export default copcc

type flag = { flag: string; description: string; default?: string }

const space = (n: number) => Array(n > 0 ? n + 1 : 1).join(' ')
export const writeHelp = (col: number) => {
  const columns = col > 180 ? 180 : col
  let message = `
   Usage: copcc [options] <path>   

   Scans a COPC/LAS file to verify the data matches the filetype specifications.

   <path>           Path to file to attempt validation scan (Note: absolute or relative to PWD)

   Options:${space(columns - 26)}*all optional*

`
  const longestDefault: number = flags.reduce((prev, curr) => {
    if (curr.default && curr.default.length > prev) return curr.default.length
    return prev
  }, 0)

  flags.forEach(({ flag, description, default: d }) => {
    const row = `   ${flag}${space(17 - flag.length)}${description} ${space(
      columns - 40 - description.length,
    )}${d ? `default: ${space(longestDefault - d.length)}${d}` : ''} `
    message += row + '\n'
  })
  return message
}
