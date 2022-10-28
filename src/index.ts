#!/usr/bin/env node
// import { ellipsoidFiles } from './test'
import copcc from './cli'

if (typeof require !== 'undefined' && require.main === module) {
  const argv = process.argv.slice(2)
  // if (argv.length < 1) argv.push(ellipsoidFiles.copc)
  // the line above enables `yarn dev` as a quick test of the CLI with good COPC data
  // can still test options (like --output), but will need to provide a source file
  copcc(argv)
}
