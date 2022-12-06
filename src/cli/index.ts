import minimist from 'minimist'
import { generateReport } from '../report/index.js'
import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { writeHelp } from './help.js'

export * from './help.js'

export const fs = { writeFileSync }
const copcVersion: string = process.env.npm_package_version || 'vX.X.X'

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
  } else process.stdout.write(JSON.stringify(report, null, 2) + '\n')

  // EXIT NODE
  return
}
