# **COPC Validator**

## Table of Contents

1. [Introduction](#introduction)
   1. [Getting Started](#getting-started)
2. [Usage](#usage)
   1. [CLI](#cli)
      1. [Options](#options)
   2. [Import](#import)
      1. [Options](#options-1)
3. [Scans](#scans)
   1. [Quick scan](#quick-scan)
   2. [Full scan](#full-scan)
   3. [Output](#output)
4. [Details](#details)
   1. [Checks](#checks)
      1. [Status & Check Objects](#status--check-objects)
      2. [Functions](#functions)
      3. [Suites](#suites)
      4. [Parsers](#parsers)
      5. [Collections](#collections)
      6. [All checks](#all-checks)
   2. [Report](#report)
      1. [Report schema](#report-schema)
5. [Future Plans](#future-plans)

# Introduction

_**COPC Validator**_ is a library for validating the header and content of a Cloud-Optimized Point Cloud (COPC) LAS file. Extending the `copc.js` library, it accepts either a (relative) file path or COPC url, and runs a series of checks against the values parsed by `copc.js`.

## Getting Started

1.  Install from `npm`

        $ npm i -g @landrush/copc-validator

    _Global install is recommended for CLI usage_

2.  Scan `copc.laz` file with `copcc` CLI

Examples:

- Default

      $ copcc ./path/to/example.copc.laz

- Deep scan, output to `<pwd>/output.json`

      $ copcc --deep path/to/example.copc.laz --output=output.json

- Deep & Minified scan with max threads = 64, showing a progress bar

      $ copcc path/to/example.copc.laz -dpmt 64

# Usage

_**COPC Validator**_ has two main usages: via the `copcc` Command-Line Interface (CLI), or imported as the `generateReport()` function

## CLI

    $ copcc [options] <path>

> _`copcc` = `copc-Checker`_

_The usage and implementation of **COPC Validator** is meant to be as simple as possible. The CLI will only need one file path and will automatically run a `shallow` scan by default, or a `deep` scan if provided with the `--deep` option. All other functionality is completely optional._

### Options

| Option     | Alias | Description                                                                     |   Type    |  Default  |
| :--------- | :---: | ------------------------------------------------------------------------------- | :-------: | :-------: |
| `deep`     |  `d`  | Read all points of each node; Otherwise, read only root point                   | `boolean` |  `false`  |
| `threads`  |  `t`  | Replace Piscina maxThreads with the provided integer                            | `number`  | CPU-based |
| `name`     |  `n`  | Replace `name` in Report with provided string                                   | `string`  | `<path>`  |
| `mini`     |  `m`  | Omit Copc or Las from Report, leaving `checks` and `scan` info                  | `boolean` |  `false`  |
| `progress` |  `p`  | Show a progress bar while reading the point data                                | `boolean` |  `false`  |
| `ouput`    |  `o`  | Writes the Report out to provided filepath; Otherwise, writes to `stdout`       | `string`  |    N/A    |
| `help`     |  `h`  | Displays help information for the `copcc` command; Overwrites all other options | `boolean` |    N/A    |
| `version`  |  `v`  | Displays `@landrush/copc-validator` version (from `package.json`)               | `boolean` |    N/A    |

## Import

Add to project:

```sh
npm i copc-validator
  # or
yarn add copc-validator
```

Import `generateReport()`:

```TypeScript
import { generateReport } from '@landrush/copc-validator'
```

- Example:
  ```TypeScript
  async function printReport() {
    const report = await generateReport({
      source: 'path/to/example.copc.laz',
      options: {} // default options
    })
    console.log(report)
  }
  ```

### Options

`generateReport` accepts **most\*** of the same options as the CLI through the `options` property of the first parameter:

Example:

```TypeScript
generateReport({
  source,
  options: {
    name: 'Name for Report output' // default: source
    mini: true // omit copc/las info from report
    deep: true // read all points per node
    maxThreads: 32 // maxThread limit for Piscina (for reading points)
    showProgress: false // show cli-progress bar while reading point data
  }
})
```

> \* **Key option differences:**
>
> - No `output`, `help`, or `version` options
> - `threads` is renamed to `maxThreads`
> - `progress` is renamed to `showProgress`
> - Any **Alias** (listed [above](###options)) will not work

# Scans

_**COPC Validator**_ comes with two scan types, `shallow` and `deep`

_(see [requirements.md](./requirements.md) for more details)_

> The report output supports a `custom` scan type, intended to be used by other developers that may extend the base functionality of _**COPC Validator**_. It is not _currently_ used anywhere in this library.

## Shallow scan

The `shallow` scan checks the LAS Public Header Block and various Variable Length Records (VLRs) to ensure the values adhere to the COPC specificiations ([found here](https://copc.io))

This scan will also check the `root` (first) point of every node (in the COPC Hierarchy) to ensure those points are valid according to the contents of the Las Header and COPC Info VLR

## Deep scan

The `deep` scan performs the same checks as a `shallow` scan, but scans every point of each node rather than just the root point, in order to validate the full contents of the Point Data Records (PDRs) against the COPC specs and Header info

## Output

_**COPC Validator**_ outputs a JSON report according to the [Report Schema](#report-schema), intended to be translated into a more human-readable format (such as a PDF or Webpage summary)

# Details

## Checks

A `Check` ultimately refers to the Object created by calling a `Check.Function` with `performCheck()`, which uses the `Check.Suite` property name to build the returned `Check.Status` into a complete `Check.Check`. This already feels like a bit much, without even mentioning `Check.Parser`s or `Check.Collection`s, so we'll break it down piece-by-piece here

Pseudo-TypeScript:

```TypeScript
namespace Check {
  type Status = {
    status: 'pass' | 'fail' | 'warn'
    info?: string
  }
  type Check = Status & { id: string }

  type Function<T> =
    | (c: T) => Status
    | (c: T) => Promise<Status>

  type Suite<T> = { [id: string]: Check.Function<T> }
  type SuiteWithSource<T> = { source: T, suite: Suite<T>}

  type Parser<Source, Parsed> = (s: Source) => Promise<SuiteWithSource<Parsed>>

  type Collection = (SuiteWithSource<any> | Promise<SuiteWithSource<any>>)[]
}
type Check = Check.Check
```

_See [`./src/types/check.ts`](./src/types/check.ts) for the actual TypeScript code_

### Status & Check Objects

A `Check.Status` Object contains a `status` property with a value of `"pass"`, `"fail"`, or `"warn"`, and optionally contains an `info` property with a `string` value.

A `Check` Object is the same as a `Status` Object with an additional string property named `id`

_`pass` means file definitely matches COPC specificiations_  
_`fail` means file does not match any COPC specifications_  
_`warn` means file may not match current COPC specifications or recommendations_

### Functions

`Check.Function`s maintain the following properties:

- Single (Object) parameter
- Syncronous or Asyncronous
- Output: `Check.Status` _(or a Promise)_
- Pure function

### Suites

A `Check.Suite` is a map of string `id`s to `Check.Function`s, where each `Function` uses the same Object as its parameter (such as the `Copc` Object, for [`./src/suites/copc.ts`](./src/suites/copc.ts)). The `id` of a `Function` becomes the `id` value of the `Check` Object when a `Check.Suite` invokes its `Function`s

_The purpose of this type of grouping is to limit the number of Getter calls for the same section of a file, like the 375 byte Header_

All `Suite`s (with their `Check.Function`s) are located under `src/suites`

#### `worker.js`

`src/parsers/worker.js` essentially matches the structure of a `Suite` because it used to be the `src/suites/point-data.ts` `Suite`. To increase speed, the `pointDataSuite` became per-Node instead of per-File, which maximizes multi-threading, but creates quite a mess since `worker.js` must be (nearly) entirely self-contained for `Piscina` threading. So `src/suites/point-data.ts` now parses the output of `src/parsers/worker.js`, all of which is controlled by the `src/parsers/nodes.ts` `Parser`

### Parsers

`Check.Parser`s are functions that take a source Object and return a `Check.SuiteWithSource` Object. Their main purpose is to parse a section of the given file into a usable object, and then return that object with its corrosponding `Suite` to be invoked from within a `Collection`.

All `Parser`s are located under `src/parsers` (ex: [`nodeParser`](./src/parsers/nodes.ts))

#### `nodes.ts`

`src/parsers/nodes.ts` is unique among `Parser`s, in that it's actually running a `Suite` repeatedly as it parses. However, the data is not returned from `Piscina` like a regular `Check.Suite`, so `nodes.ts` then gives the output data to the (_new_) `pointDataSuite` for sorting into `Check.Status`es

### Collections

`Check.Collection`s are arrays of `Check.Suite`s with their respective source Object (`Check.SuiteWithSource` above). They allow Promises in order to use `Check.Parser`s internally without having to `await` them.

All `Collection`s are located under `src/collections` (ex: [`CopcCollection`](./src/collections/copc.ts))

Replacing `Collection`s is the primary way of generating `custom` reports through `generateReport`, as you can supply different `Check.Suite`s to perform different `Check.Function`s per source object.

#### Custom scan

`generateReport` has functionality to build customized reports by overwriting the `Check.Collection`s used within:

Pseudo-Type:

```TypeScript
generateReport({
  source,
  options: {}
}, {
  copc: ({
    filepath: string,
    copc: Copc,
    get: Getter,
    deep: boolean,
    maxThreads?: number
  }) => Promise<Check.Collection>
  las: ({
    get: Getter,
    header: Las.Header,
    vlrs: Las.Vlr[]
  }) => Promise<Check.Collection>
  fallback: (get: Getter) => Promise<Check.Collection>
})
```

### All Checks

| ID                         | Description                                                             |  Scan   | Suite          |
| :------------------------- | ----------------------------------------------------------------------- | :-----: | -------------- |
| `minorVersion`             | `copc.header.minorVersion` is `4`                                       | Shallow | `Header`       |
| `pointDataRecordFormat`    | `copc.header.pointDataRecordFormat` is `6`, `7`, or `8`                 | Shallow | `Header`       |
| `headerLength`             | `copc.header.headerLength` is `375`                                     | Shallow | `Header`       |
| `pointCountByReturn`       | Sum of `copc.header.pointCountByReturn` equals `copc.header.pointCount` | Shallow | `Header`       |
| `legacyPointCount`         | `header.legacyPointCount` follows COPC/LAS specs                        | Shallow | `manualHeader` |
| `legacyPointCountByReturn` | `header.legacyPointCountByReturn` follows COPC/LAS specs                | Shallow | `manualHeader` |
| `vlrCount`                 | Number of VLRs in `copc.vlrs` matches `copc.header.vlrCount`            | Shallow | `Vlr`          |
| `evlrCount`                | Number of EVLRs in `copc.vlrs` matches `copc.header.evlrCount`          | Shallow | `Vlr`          |
| `copc-info`                | Exactly 1 copc `info` VLR exists with size of `160`                     | Shallow | `Vlr`          |
| `copc-hierarchy`           | Exactly 1 copc `hierarchy` VLR exists                                   | Shallow | `Vlr`          |
| `laszip-encoded`           | Checks for existance of LasZIP compression VLR, warns if not found      | Shallow | `Vlr`          |
| `wkt`                      | Ensures `wkt` string can initialize `proj4`                             | Shallow | `manualVlr`    |
| `bounds within cube`       | Copc `cube` envelops Las bounds (`min` & `max`)                         | Shallow | `Copc`         |
| `rgb`                      | RGB channels are used in PDR, if present                                | Shallow | `PointData`    |
| `rgbi`                     | Checks for 16-bit scaling of RGBI values, warns if 8-bit                | Shallow | `PointData`    |
| `xyz`                      | Each point exists within Las and Copc bounds, per node                  | Shallow | `PointData`    |
| `gpsTime`                  | Each point has `GpsTime` value within Las bounds                        | Shallow | `PointData`    |
| `sortedGpsTime`            | The points in each node are sorted by `GpsTime` value, warns if not     |  Deep   | `PointData`    |
| `returnNumber`             | Each point has `ReturnNumber <= NumberOfReturns`                        | Shallow | `PointData`    |
| `nodesReachable`           | Every `Node` (`'D-X-Y-Z'`) in the `Hierarchy` is reachable              | Shallow | `PointData`    |
| `...ID`                    | ...Description                                                          | Shallow | `...`          |

Checks and their IDs are subject to change as I see fit

## Report

### Report schema

See [`JSON Schema`](./schema/report.schema.json)

TypeScript pseudo-type Report:

```TypeScript
import * as Copc from 'copc'

type Report = {
  name: string
  scan: {
    type: 'quick' | 'full' | 'custom'
    filetype: 'COPC' | 'LAS' | 'Unknown'
    start: Date
    end: Date
    time: number
  }
  checks: ({
    id: string
    status: 'pass' | 'fail' | 'warn'
    info?: string
  })[]

  // When scan.filetype === 'COPC'
  copc?: {
    header: Copc.Las.Header
    vlrs: Copc.Las.Vlr[]
    info: Copc.Info
    wkt: string
    eb: Copc.Las.ExtraBytes
  }

  // When scan.filetype === 'LAS'
  las?: {
    header: Copc.Las.Header
    vlrs: Copc.Las.Vlr[]
  }
  error: {
    message: string
    stack?: string
  }

  // When scan.filetype === 'Unknown'
  error: {
    message: string
    stack?: string
  }
  copcError?: {
    message: string
    stack?: string
  } // only used if Copc.create() and Las.*.parse() fail for different reasons
}
```

# Future Plans

- Add more `Check.Function`s - waiting on laz-perf chunk table
- Implement `--las` option to validate file against Las 1.4 specifications
- Continue to optimize for speed, especially large (1.5GB+) files
- Trim/Streamline Node Parsing vs Other Parsers

<!--for styling the Table of Contents-->
<style type="text/css">
    ol ol { list-style-type: upper-alpha; }
    ol ol ol {list-style-type: upper-roman;}
</style>
