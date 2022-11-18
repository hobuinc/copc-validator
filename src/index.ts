#!/usr/bin/env node
import copcc from './cli/index.js'
import { pathToFileURL } from 'url'

// module was imported
export * from './report/index.js'
export * from './collections/index.js'
export * from './parsers/index.js'
export * from './suites/index.js'

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  // module was not imported but called directly
  await copcc(process.argv.slice(2))
}
