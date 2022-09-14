# **COPC Validation**

## Table of Contents

1. [Introduction](#introduction)
   1. [Purpose](#purpose)
   2. [Scope](#scope)
   3. [Intended Audience](#indended-audience)
   4. [Intended Use](#indended-use)
   5. [Definitions & Acronyms](#definitions--acronyms)
2. [Overall Description](#overall-description)
   1. [User Needs](#user-needs)
   2. [Assumptions & Dependencies](#assumptions--dependencies)
3. [Features & Requirements](#features--requirements)
   1. [Scans](#scans)
      1. [Quick scan](#quick-scan)
      2. [Full scan](#full-scan)
   2. [Report](#report)
4. [Software](#software)
   1. [Checks](#checks)
   2. [Report schema](#report-schema)

# Introduction

_COPC Validator_ (name TBD) is a NPM package that performs extended validation checking against COPC type files

## Purpose

The purpose of this package is to allow COPC users to verify that a given file is genuinely COPC and the software will provide a detailed report on the integrity of the file, pointing out where and why there may be issues. This will protect the COPC type from malicious implementations and provide a centralized arbiter of what is and is-not proper COPC.

## Scope

This software will be an NPM-published package (library?) that inputs a file, performs a quick scan of the file header or a full scan of the entire contents, and reports the status of each check performed via JSON output.

## Indended Audience

The main audience for _COPC Validator_ is internal to Hobu, for a revamped [copc.io](https://copc.io) website that includes a file validator.  
However, the package will also be published as an open source command-line utility to allow users to verify files locally.

## Indended Use

The intended use for most users will be the [copc.io](https://copc.io) validator webpage that utilizes this package to scan provided files and report the checks completed, the status (`pass`/`fail` and/or a message) of each check, and other detailed information about the COPC file that can be determined; and then allow the user to download the report as a PDF.

The other possible use case will be users who install the command-line utility from NPM and use it to validate COPC files with their own machine. The utility should still provide the same information as the website, sans maybe the PDF (if its impossible).

## Definitions & Acronyms

- LAS = binary file format for 3D point cloud data
- LAZ = LAS but compressed
- VLR = Variable Length Record
  - 54+`X` bytes/each
- EVLR = Extended Variable Length Record
  - 60+`X` bytes/each at **E**nd of file
- PDR = Point Data Record
- PDRF = PDR Format
- CRS = Coordinate Reference System
- WKT = Well Known Text CRS _(required by PDRF 6-10)_

# Overall Description

## User Needs

### Ease of use

The process of getting a file validated should be simple and easy. It should be a single command (with minimal options), along the lines of:

```sh
$ copc-validator [...filepaths] --full
```

### Detailed reporting

The output should include detailed information about the file metadata, contents, and checks completed (with `pass`/`fail` status, and (possibly) informational messages).

### Usable in the Browser

Ultimately, this package will be implemented onto [copc.io](https://copc.io), so it should be easily usable in a browser setting.

## Assumptions & Dependencies

- Operating System: Unix-based (MacOS/Linux)

This package will be written on MacOS but should be fully compatible with Linux. No guarentees about Windows compatibility.

- Technologies:
  - NodeJS
  - TypeScript
- Dependencies:
  - [`yargs`](https://www.npmjs.com/package/yargs)
  - [`copc`](https://www.npmjs.com/package/copc)

# Features & Requirements

## Scans

All scans perform checks according to [LAS 1.4](https://www.asprs.org/wp-content/uploads/2010/12/LAS_1_4_r13.pdf) and [COPC 1.0](https://copc.io/copc-specification-1.0.pdf) specifications.

### **Quick scan**

### Errors

Validation fails if:

- LAS version is not `1.4`
- LAS PDRF is not `6`, `7`, or `8`
- COPC `info` VLR is missing/mispositioned
- COPC `hierarchy` VLR is missing
- Fixed chunk size
- Shape mismatches chunking
- Dead hierarchy space
- CRS = Geotiffs (vs WKT)
- Octree center no match header bounds
- Root hierarchy points to incorrect location
- Unreachable hierarchy nodes
- Unreachable point data (not addressed by hierarchy)
- Multiple COPC nodes
- Too many nodes in same page

### Warnings

Validation passes but adds message to report if:

- Missing SRS
- Extra bytes VLRs
- Zero point nodes _(non-error message)_

### **Full scan**

### Errors

In addition to performing a Quick Scan, validation fails if:

- GPS time outside GPS time extents
- LAS metadata extents & ranges
- Chunk count mismatch
- Points outside node bounds

### Warnings

Validation passes but adds message to report if:

- Unsorted GPS times
- Unutilized RGB in PDRF

## Report

Validation report will include:

- File name
- Scan start/end times(?)
- Coordinate info
- GPS Timer
- Position on globe (image)
- Summary of checks ran
- Status/info of non-passing checks
- VLR(s) info
  - **LAS VLR**
    - Public header
      - version = `1.4`
      - PDRFs = `6 | 7 | 8`
    - CRS VLR
    - Classification VLR
    - Extra Bytes
    - Textarea description
  - **COPC VLR**
    - First after header
    - `info` & `hierarchy` VLRs exist
  - LAZ compression
    - version = `1.3`
  - PDAL
    - Metadata
    - Pipeline

Reports will be output via JSON ([see below](#report-schema)) <!-- but can be interpreted into a webpage summary or full PDF report -->

# Software

NPM package with command-line functionality to check local files and generate JSON (and PDF?) reports, as well as in-browser capability to validate dropped/selected files and download a PDF report

## Checks

|  ID   | Name            | Description                         | Logic                                 | Result                    |
| :---: | :-------------- | ----------------------------------- | ------------------------------------- | ------------------------- |
| **1** | File signature  | Matches LAS file signature ('LASF') | `byte[0-3]` = `'LASF'`                | `pass` / `fail`           |
| **2** | LAS version     | Version number of LAS spec          | `byte[24]` = `1`, `byte[25]` = `4`    | `pass` / `fail`           |
| **3** | COPC info first | Start of COPC info                  | `byte[377-340]` = `'copc'`            | `pass` / `fail`           |
| **4** | COPC version    | Version number of COPC spec         | `byte[393]` = `1`, `byte[394]` = `0`  | `pass` / `fail` / `warn`? |
| **5** | PDR format      | LAZ Point Data Record Format        | `mask[2]` `byte[104]` = `6 \| 7 \| 8` | `pass` / `fail`           |
| **6** | PDR length      | LAZ Point Data Record length        | `byte[105-106]`                       | `report`                  |
| **?** | Unutilized RGB  | PDRF includes RGB fields, unused    | `PDRF` = `7 \| 8`, `RGB` = `0`        | `pass` / `warn`           |

_`byte[x]` means byte(s) at offset `x`_  
_`mask[y]` `byte[x]` means ignore `y` high bits of the following byte_  
_`byte[x]` `mask[y]` means ignore `y` low bits of the preceeding byte_

_`pass` means file definitely matches COPC specificiations_  
_`fail` means file does not match any COPC specifications_  
_`warn` means file may not match current COPC specifications (out-dated), or may cause issues (extra-bytes?)_  
_`report` means validator will include information about check in report, but the bytes have no bearing on COPC validation_

## Report schema

```TypeScript
{
  file: string,
  scan: {
    type: "quick" | "full",
    start: Date,
    end: Date
  },
  las: {
    'file-signature': string,
    'file-source-id': number,
    'global-encoding': {
      'gps-time-type': "week" | "adj-std",
      'synthetic-return-numbers': boolean
      wkt: boolean                               // true
    }
    version: [string, string]                    // ['1', '4']
    systemId: string,
    'generating-software': string,
    'created-day': number,
    'created-year': number,
    'header-size': number,                       // 375
    'pdr-offset': number,
    'vlr-count': number,
    'pdr-format': string,                        // "6" | "7" | "8"
    'pdr-length': number,
    'legacy-set': boolean,
    scale: {
      x: number,
      y: number,
      z: number
    },
    offset: {
      x: number,
      y: number,
      z: number
    },
    max: {
      x: number,
      y: number,
      z: number
    },
    min: {
      x: number,
      y: number,
      z: number
    },
    'evlr-start': number,
    'evlr-count': number,
    'point-record-count': number,
    'point-by-return-count': number[15]
  }
  vlrs: {
    'las-crs': {
      userId: "LASF_Spec"
      //...
    },
    'las-classification': {
      userId: "LASF_Spec",
      recordId: 0,
      classification?: [
        {
          ClassNumber: string,
          Description: string
        }
      ]
    },
    'las-textarea': {
      userId: "LASF_Spec",
      recordId: 3,
      content?: string
    },
    'las-extra-bytes': {
      userId: "LASF_Spec",
      recordId: 4,
      content: {
        'data_type': number,
        name: string,
        'no_data'?: any,
        min?: any,
        max?: any,
        scale?: number,
        offset?: number
      }
    }
    'copc-info': {
      userId: "copc",
      recordId: 1
      length: number,
      description?: string
      info: {
        center: {
          x: number,
          y: number,
          z: number
        },
        halfsize: number,
        spacing: number,
        'root_hier_offset': number,
        'root_hier_size': number,
        gpstime: {
          min: number,
          max: number
        }
      }
    },
    'copc-hierarchy': {
      userId: "copc",
      recordId: 1000,
      length: number,
      description?: string
      pages: [
        {

        },
        //...
      ]
    }
  }
  "checks": [
    {
      "id": 1,
      "name": "File signature",
      "status": "pass",
      "info": {
        0: "L",
        1: "A",
        2: "S",
        3: "F"
      }
    },
    {
      "id": 2,
      "name": "LAS version",
      "status": "fail",
      "info": {
        24: 1,
        25: 3
      }
    },
    //...
  ]
}
```
