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

_(See [README.md](./README.md))_

## Purpose

The purpose of this package is to allow COPC users to verify that a given file is genuinely COPC; the software will provide a detailed report on the integrity of the file, pointing out where and why there may be issues. This will protect the COPC type from malicious implementations and provide a centralized arbiter of what is and is-not proper COPC.

## Scope

This software will be an NPM-published package (library?) that inputs a file, performs a quick scan of the file header or a full scan of the entire contents, and reports the status of each check performed via JSON output.

## Indended Audience

The main audience for _COPC Validator_ is internal to Hobu, for a revamped [copc.io](https://copc.io) website that includes a file validator.  
However, the package will also be published as an open source command-line utility to allow users to verify files locally.

## Indended Use

The intended use for most users will be through the [copc.io](https://copc.io) validator webpage which will utilize this package to scan provided the file(s) and report the checks completed, the status (`pass`/`fail` and/or a message) of each check, and other detailed information about the COPC file that can be determined; and then allow the user to download the report as a PDF.

The other possible use case will be users who install the command-line utility from NPM and use it to validate COPC files with their own machine. The utility should still provide the same information as the website, sans maybe the PDF (if it's not possible).

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
  - [`copc.js`](https://www.npmjs.com/package/copc)
  <!-- - [`yargs`](https://www.npmjs.com/package/yargs)-->

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
- COPC VLRs are unique
- Fixed chunk size
- Shape mismatches chunking
- Dead hierarchy space
- CRS = Geotiffs (vs WKT)
- Octree center no match header bounds
- Root hierarchy points to incorrect location
- Unreachable hierarchy nodes
- Multiple COPC nodes
- Too many nodes in same page
- Unreachable point data (not addressed by hierarchy)

### Warnings

Validation passes but adds message to report if:

- Missing SRS
- 8-bit RGBI values
- Extra bytes VLRs
- Zero point nodes

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
- Scan start/end times
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

Reports will be output via JSON ([see README.md](README.md#report-schema)) <!-- but can be interpreted into a webpage summary or full PDF report -->

# Software

NPM package with command-line functionality to check local files and generate JSON (and PDF?) reports, as well as in-browser capability to validate dropped/selected files and download a PDF report

## Checks

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

All checks are located in `src/checks`
