#!/usr/bin/env node
import copcc from './cli/index.js'
import { pathToFileURL } from 'url'

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  // module was not imported but called directly
  await copcc(process.argv.slice(2))
}
