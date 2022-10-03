# **COPC Validator**

## Table of Contents

1. [Introduction](#introduction)
   1. [Usage](#usage)
   2. [Options](#options)
      1. [Quick scan](#quick-scan)
      2. [Full scan](#full-scan)
   3. [Output](#output)
2. [Details](#details)
   1. [Checks](#checks)
      1. [Suites](#suites)
      2. [Functions](#functions)
      3. [Nested Suites](#nested-suites)
      4. [All checks](#all-checks)
   2. [Report schema](#report-schema)

# Introduction

_**COPC Validator**_ is a library for validating the header and content of a Cloud-Optimized Point Cloud (COPC) LAS file. Extending the `copc.js` library, it accepts either a (relative) file path or COPC url, and runs a series of checks against the values parsed by `copc.js`.

## Usage

Currently, _**COPC Validator**_ is mostly written as a library to import into other packages. But eventually this package will have its own fully operational Command-Line Interface (CLI) to validate COPC files locally. That usage will look (something) like:

```sh
$ copcc example.copc.laz --full
```

_The usage and implementation of **COPC Validator** is meant to be as simple as possible. The CLI will only need one file path (or multiple paths?) and will automatically run a `quick` scan by default, or a `full` scan if provided with the `--full` option_

## Options

_**COPC Validator**_ comes with two scan types, `quick` and `full`

_(see [requirements.md](./requirements.md) for more details)_

### Quick scan

The `quick` scan checks the LAS Public Header Block and various Variable Length Records (VLRs) to ensure the values adhere to the COPC specificiations ([found here](https://copc.io))

### Full scan

The `full` scan performs a `quick` scan, then continues to validate the full contents of the Point Data Records (PDRs) and confirms it adheres to the COPC specs AND is valid according to the contents of the Public Header Block and VLRs

### Custom scan

The report output supports a `custom` scan type, intended to be used by other developers that may extend the base functionality of _**COPC Validator**_. It is not _currently_ used anywhere in this library.

## Output

_**COPC Validator**_ outputs a JSON report according to the [Report Schema](#report-schema), intended to be translated into a more human-readable format (such as a PDF or Webpage summary)

# Details

<!-- NPM package with command-line functionality to check local files and generate JSON (and PDF?) reports, as well as in-browser capability to validate dropped/selected files and download a PDF report -->

## Checks

All checks are located in `src/checks`, separated by their filetype (`copc` or `las`) and Suite source

### Suites

Checks are grouped into Suites that share a common source, such as the `Copc` object. This limits the number of `Getter` calls needed, and should eliminate most (if not all) repeat calls for sections of a Copc file. The `id` of a check is the property name for the Function in the Suite.

### Functions

Check functions maintain the following properties:

- Syncronous or Asyncronous
- Output: `{ status: 'pass' | 'fail' | 'warn', info?: unknown }` _(or a Promise)_
- Pure function

TypeScript:

```TypeScript
namespace Check {
  type Status = {
    status: 'pass' | 'fail' | 'warn'
    info?: unknown
  }
  type Function<T> =
    | (c: T) => Status
    | (c: T) => Promise<Status>
  type Check = Status & {id: string}
  type Suite<T> = Record<string, checkFunction<T>>
}
```

_`pass` means file definitely matches COPC specificiations_  
_`fail` means file does not match any COPC specifications_  
_`warn` means file may not match current COPC specifications (out-dated), or may cause issues (extra-bytes?)_

### Nested Suites

A `Check.Function` can also be a `NestedSuite` instead of a singular check, meaning it outputs a complete `Check` array (`Check[]` instead of `Status`). This simplifies the process of sharing and altering Suite sources by allowing a `Check.Function` to build its own object and run multiple distinct checks on that new object type.  
See `src/checks/copc/hierarchy.ts` for an example of a Nested Suite.

### All Checks

| ID                      | Description                                                             | Scan  | Suite       | File                        |
| :---------------------- | ----------------------------------------------------------------------- | :---: | ----------- | --------------------------- |
| `fileSignature`         | [Redundant] First four bytes matches `'LASF'`                           | Quick | `Copc`      | `checks/copc/header.ts`     |
| `majorVersion`          | [Redundant] `copc.header.majorVersion` is `1`                           | Quick | `Copc`      | `checks/copc/header.ts`     |
| `minorVersion`          | `copc.header.minorVersion` is `4`                                       | Quick | `Copc`      | `checks/copc/header.ts`     |
| `headerLength`          | `copc.header.headerLength` is `375`                                     | Quick | `Copc`      | `checks/copc/header.ts`     |
| `pointDataRecordFormat` | `copc.header.pointDataRecordFormat` is `6`, `7`, or `8`                 | Quick | `Copc`      | `checks/copc/header.ts`     |
| `pointCountByReturn`    | Sum of `copc.header.pointCountByReturn` equals `copc.header.pointCount` | Quick | `Copc`      | `checks/copc/header.ts`     |
| `vlrCount`              | Number of VLRs in `copc.vlrs` matches `copc.header.vlrCount`            | Quick | `Copc`      | `checks/copc/vlrs.ts`       |
| `evlrCount`             | Number of EVLRs in `copc.vlrs` matches `copc.header.evlrCount`          | Quick | `Copc`      | `checks/copc/vlrs.ts`       |
| `copc-info`             | Exactly 1 copc `info` VLR exists with size of `160`                     | Quick | `Copc`      | `checks/copc/vlrs.ts`       |
| `copc-hierarchy`        | Exactly 1 copc `hierarchy` VLR exists                                   | Quick | `Copc`      | `checks/copc/vlrs.ts`       |
| `laszip-encoded`        | Checks for existance of LasZIP compression VLR, warns if not found      | Quick | `Copc`      | `checks/copc/vlrs.ts`       |
| `rgb`                   | RGB channels are used in PDR, if present                                | Quick | `Hierarchy` | `checks/copc/point-data.ts` |
| `rgbi`                  | Checks for 16-bit scaling of RGBI values, warns if 8-bit                | Quick | `Hierarchy` | `checks/copc/point-data.ts` |
| `xyz`                   | Each point exists within Las and Copc bounds, per node                  | Quick | `Hierarchy` | `checks/copc/point-data.ts` |
| `returns`               | Each point has `ReturnNumber <= NumberOfReturns`                        | Quick | `Hierarchy` | `checks/copc/point-data.ts` |
| `...ID`                 | ...Description                                                          | Quick | `...`       | `checks/copc/*.ts`          |

Checks and their IDs are subject to change as I see fit

## Report schema

```TypeScript
{
  name: string,
  scan: {
    type: 'quick' | 'full' | 'custom'
    filetype: 'COPC' | 'LAS' | 'Unknown'
    result: 'valid' | 'invalid' | 'NA'
    start: Date
    end: Date
    time: number
  },
  checks: [
    {
      id: string
      status: 'pass' | 'fail' | 'warn'
      info?: any
    },
  ],
  // When filetype === 'COPC'
  copc: {
    header: Copc.Las.Header
    vlrs: Copc.Las.Vlr[]
    info: Copc.Info
    wkt?: string
    eb?: Copc.Las.ExtraBytes
  },
  // When filetype === 'LAS'
  las: {
    header: Copc.Las.Header
    vlrs: Copc.Las.Vlr[]
  },
  // When filetype === 'Unknown'
  error: Error,
}
```
