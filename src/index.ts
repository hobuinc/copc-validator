#!/usr/bin/env node
import copcc from 'cli'
import { pathToFileURL } from 'url'

// module was imported
export * from 'report'
export * from 'collections'
export * from 'parsers'
export * from 'suites'

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  // module was not imported but called directly
  await copcc(process.argv.slice(2))
}

// TODO: Fix ts-node with ESM. Broken:
//  * yarn dev
//  * yarn test
