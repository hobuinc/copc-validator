import minimist from 'minimist'
import { generateReport } from '../report/index.js'
import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { helpString } from './help.js'

export * from './help.js'

export const fs = { writeFileSync }
const copcVersion: string = process.env.npm_package_version || 'v0.4.0'

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
  pdal: boolean
  P: boolean //alias
  progress: boolean
  p: boolean //alias
  output?: string
  o?: string //alias
  name?: string
  n?: string //alias
  workers?: number
  w?: number //alias
  queue?: number
  q?: number //alias
  sample?: number
  s?: number //alias
}

const stdoutWrite = (str: string) => process.stdout.write(str)
const writeHelp = (col: number) => stdoutWrite(helpString(col))

// ========== MAIN CLI FUNCTION ==========
export const copcc = async (argv: string[]) => {
  if (argv === undefined || argv.length < 1) {
    stdoutWrite('ERROR: Not enough argument(s) provided\n')
    writeHelp(process.stdout.columns)
    process.exitCode = 1
    return
  }

  // PARSE ARGS
  const args = minimist<ExpectedArgv>(argv, {
    boolean: ['deep', 'mini', 'progress', 'help', 'version'],
    string: ['output', 'name'],
    alias: {
      output: 'o',
      deep: 'd',
      name: 'n',
      workers: 'w',
      queue: 'q',
      sample: 's',
      mini: 'm',
      pdal: 'P',
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
    queue,
    sample,
    mini,
    pdal,
    progress,
  } = args

  if (help) {
    writeHelp(process.stdout.columns)
    return
  }
  if (version) {
    stdoutWrite(copcVersion + '\n')
    return
  }

  // VALIDATE ARGS
  if (!file) {
    stdoutWrite('ERROR: Must provide a filepath to be validated\n')
    writeHelp(process.stdout.columns)
    process.exitCode = 1
    return
  }
  if (rest.length > 0) {
    stdoutWrite('ERROR: Too many arguments (filepaths) provided\n')
    writeHelp(process.stdout.columns)
    process.exitCode = 1
    return
  }

  const name = givenName || file

  // RUN SCAN
  const report = await generateReport({
    source: file,
    options: {
      name,
      deep,
      workers,
      queueLimit: queue,
      sampleSize: sample,
      mini,
      pdal,
      showProgress: progress,
    },
  })

  // OUTPUT SCAN
  if (output) {
    const path = resolve(output)
    try {
      fs.writeFileSync(path, JSON.stringify(report, null, 2))
      stdoutWrite(`Report successfully written to ${path}\n`)
    } catch (err) {
      console.error(err)
    }
  } else process.stdout.write(JSON.stringify(report, null, 2) + '\n')

  // EXIT NODE
  return
}
