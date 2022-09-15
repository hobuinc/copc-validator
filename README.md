# **COPC Validator**

## Table of Contents

1. [Introduction](#introduction)
   1. [Usage](#usage)
   2. [Options](#options)
      1. [Quick scan](#quick-scan)
      2. [Full scan](#full-scan)
2. [Details](#details)
   1. [Checks](#checks)
      1. [All checks](#all-checks)
   2. [Report schema](#report-schema)

# Introduction

_**COPC Validator**_ is a library for validating the header and content of a Cloud-Optimized Point Cloud (COPC) LAS file. Extending the `copc.js` library, it accepts either a (relative) file path or COPC url, and runs a series of checks against the values parsed by `copc.js`.

## Usage

Currently, _COPC Validator_ is mostly written as a library to import into other packages. But eventually this package will have its own fully operational Command-Line Interface (CLI) to validate COPC files locally. That usage will look (something) like:

```sh
$ validcopc example.copc.laz --full
```

_The usage and implementation of **COPC Validator** is meant to be as simple as possible. The CLI will only need one file path (or multiple paths?) and will automatically run a `quick` scan by default, or a `full` scan if provided with the `--full` option_

## Options

_COPC Validator_ comes with two scan types, `quick` and `full`

_(see [requirements.md](./requirements.md) for more details)_

### Quick scan

The `quick` scan checks the LAS Public Header Block and various Variable Length Records (VLRs) to ensure the values adhere to the COPC specificiations ([found here](https://copc.io))

### Full scan

The `full` scan performs a `quick` scan, then continues to validate the full contents of the Point Data Records (PDRs) and confirms it adheres to the COPC specs AND is valid according to the contents of the Public Header Block and VLRs

## Output

_COPC Validator_ outputs a JSON report according to the Report Schema (in [requirements.md](./requirements.md#report-schema))

<!-- > E.g. `jest point-data.test --watchAll -t include-dimensions` will re-run tests whose name includes `include-dimensions` in files whose name contains `point-data.test` any time you save a file. -->

# Details

<!-- NPM package with command-line functionality to check local files and generate JSON (and PDF?) reports, as well as in-browser capability to validate dropped/selected files and download a PDF report -->

## Checks

### IDs

- `1` digit check `ID`s corrospond to VLR header/existence checks
  - Allows the validator to understand 10 specific VLR `userId` & `recordId` combinations
- `2` digit check `ID`s corrospond to the LAS Public Header Block checks
- `3` digit check `ID`s corrospond to COPC header checks
- `4` digit check `ID`s corrospond to Full Scan exclusive checks (full file contents)

### Functions

Check functions maintain the following properties:

- Parameters: `(c: Copc)`
- Output: `boolean | {status: 'pass' | 'fail' | 'warn', info?: any }`
- Pure function

TypeScript:

```TypeScript
type Status = {
  status: 'pass' | 'fail' | 'warn'
  info?: any
}
type checkFunction = (c: Copc) => boolean | Status
```

All checks are located in `src/checks`

### All Checks

| ID                     | Description        | Check                                |     Result      |
| :--------------------- | ------------------ | :----------------------------------- | :-------------: |
| `header.fileSignature` | LAS File Signature | `copc.header.fileSignature = 'LASF'` | `pass` / `fail` |
| `ID`                   | Description        | `copc. = `                           | `pass` / `fail` |

_`pass` means file definitely matches COPC specificiations_  
_`fail` means file does not match any COPC specifications_  
_`warn` means file may not match current COPC specifications (out-dated), or may cause issues (extra-bytes?)_

## Report schema

```TypeScript
{
  file: string | "undefined"
  scan: {
    type: "quick" | "full"
    start: Date
    end: Date
  },
  header: {
    fileSignature: string //'LASF'
    fileSourceId: number
    globalEncoding: number
    projectId: string
    majorVersion: number //1
    minorVersion: number //4
    systemIdentifier: string
    generatingSoftware: string
    fileCreationDayOfYear: number
    fileCreationYear: number
    headerLength: number //375
    pointDataOffset: number
    vlrCount: number
    pointDataRecordFormat: number //6 | 7 | 8
    pointDataRecordLength: number
    pointCount: number
    pointCountByReturn: number[15]
    scale: [number, number, number]
    offset: [number, number, number]
    min: [number, number, number]
    max: [number, number, number]
    waveformDataOffset: number
    evlrOffset: number
    evlrCount: number
  },
  vlrs: [
    {
      userId: string
      recordId: number
      contentOffset: number
      contentLength: number
      description: string
      isExtended: boolean
    }
  ],
  info: {
    cube: number[6]
    spacing: number
    rootHierarchyPage: {
      pageOffset: number
      pageLength: number
    },
    gpsTimeRange: [ number, number ]
  },
  checks: [
    {
      id: number
      name: string
      status: 'pass' | 'fail' | 'warn'
      info?: any
    }
  ]
}
```
