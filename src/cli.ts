import minimist from 'minimist'
import { generateReport } from 'report'
import { writeFileSync } from 'fs'
// import * as fs from 'fs'
import { resolve } from 'path'

export const fs = { writeFileSync }

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
 * TODO: `las`: Skip attempting to validate as COPC and just validate the LAS specs
 *                                       *Optional - attempts Copc first if omitted*
 *
 * `files...`: A list of file(s) to run the validation checks against  *Required >= 1*
 */
export const copcc = async (argv: string[]) => {
  if (argv === undefined || argv.length < 1)
    throw new Error('Not enough argument(s) provided')

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
  const { _: files, deep, output, name: givenName } = args

  // VALIDATE ARGS
  if (files.length < 1)
    throw new Error('Must provide at least one (1) file to be validated')

  const name = givenName || files[0]
  // currently accepts more than one file as an arg because it'd be easy enough
  // to loop over the files array and attempt multiple scans. We'd just need a
  // better solution for output (either --outputDir or force parse --output as
  // as directory if multiple files are supplied, or something else)
  // I'm currently doing neither and only reading the first file in the array

  // deep & output don't need validated because undefined/false is used in context

  // RUN SCAN
  const start = performance.now()
  const report = await generateReport(files[0], { name, deep })
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
  deep: boolean
  d: boolean //alias
  output?: string
  o?: string //alias
  name?: string
  n?: string //alias
}
