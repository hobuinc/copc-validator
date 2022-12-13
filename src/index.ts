#!/usr/bin/env node
import { copcc } from './cli/index.js'

await copcc(process.argv.slice(2))
