import minimist from 'minimist'
import { ellipsoidFilename, ellipsoidFiles } from './test'
import { shallowScan, deepScan } from './report'
import { writeFile } from 'fs'
import { resolve } from 'path'
import { exit } from 'process'

// const filename = process.argv[2] || ellipsoidFiles.copc

// const start = performance.now()
// quick(filename)
//   .then((r) => console.dir(r, { depth: null })) //console.log(JSON.stringify(r, null, 2))) //
//   .then((_r) => {
//     const end = performance.now()
//     console.log(`Time: ${end - start}ms`)
//     //`start` and this `.then()` are just for my development purposes
//     // plus I added `time` to the report to cover what I wanted to know
//   })

// console.log(process.argv)

type ExpectedArgv = {
  _: string[]
  deep: boolean
  d: boolean //alias
  output?: string
  o?: string //alias
  name?: string
  n?: string //alias
}
const argvIsValid = (argv: minimist.ParsedArgs): argv is ExpectedArgv =>
  argv._.length >= 1 &&
  typeof argv.deep === 'boolean' &&
  (typeof argv.output === 'string' || typeof argv.output === 'undefined') &&
  (typeof argv.name === 'string' || typeof argv.name === 'undefined')

/** CLI Usage:
 * ```
 * copcc {--deep} {--output: string} {--name: string} [files...]
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
 * `files...`: A list of file(s) to run the validation checks against  *Required >= 1*
 */
export const copcc = async (argv: string[]) => {
  // PARSE ARGS
  const args = minimist<ExpectedArgv>(argv, {
    boolean: ['deep'],
    string: ['output', 'name'],
    alias: {
      output: 'o',
      deep: 'd',
      name: 'n',
    },
  })
  console.log(args)
  const { _: files, deep, output, name } = args

  // VALIDATE ARGS
  if (files.length < 1)
    throw new Error('Must provide at least one (1) file to be validated')
  // currently accepts more than one file as an arg because it'd be easy enough
  // to loop over the files array and attempt multiple scans. We'd just need a
  // better solution for output (either --outputDir or force parse --output as
  // as directory if multiple files are supplied)
  // I'm currently doing neither and only reading the first file in the array

  // deep, output, and name don't need validated because undefined is used in context

  // RUN SCAN
  const report = deep
    ? await deepScan(files[0], name)
    : await shallowScan(files[0], name)

  // OUTPUT SCAN
  if (output) {
    const path = resolve(output)
    writeFile(path, JSON.stringify(report, null, 2), (err) => {
      if (err) {
        console.error(err)
      }
      console.log(`Report successfully written to: ${path}`)
      exit()
    })
  } else {
    console.dir(report, { depth: null })
    exit()
  }
  // console.dir prints entire report object & keeps VSCode syntax highlighting
}

export default copcc
