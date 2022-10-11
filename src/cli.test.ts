import copcc, { fs } from './cli'
// import * as fs from 'fs'
// import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { shallowScan, deepScan } from './report'
import { ellipsoidFiles } from 'test'
import { Report } from 'types'

// const fs = { writeFileSync }

const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {})
const mockProcessWrite = jest
  .spyOn(process.stdout, 'write')
  .mockImplementation(() => true)
  .mockName('process.write')
const mockFileWrite = jest
  .spyOn(fs, 'writeFileSync')
  .mockImplementation((_file, data) =>
    JSON.parse(typeof data === 'string' ? data : data.toString()),
  )
  .mockName('fs.writeFileSync')

const filename = ellipsoidFiles.copc
const outputPath = 'output.json'
const reportName = 'report-name'
const defaultArgs = [filename]
const fileOutput = defaultArgs.concat(['-o', outputPath])
const deepArgs = defaultArgs.concat(['--deep'])
const nameArgs = defaultArgs.concat([`--name=${reportName}`])
const deepNameArgs = [...new Set(deepArgs.concat(nameArgs))]
const deepScanFileOutput = [...new Set(fileOutput.concat(deepArgs))]

afterEach(() => jest.clearAllMocks())
afterAll(() => jest.restoreAllMocks())

test('cli shallow', async () => {
  const expectedScan = expectScan(await shallowScan(filename))

  await copcc(defaultArgs)

  expect(mockProcessWrite).toBeCalledTimes(1)
  validateMockParams(mockProcessWrite, expectedScan)
  expect(mockFileWrite).toBeCalledTimes(0)
  mockProcessWrite.mockClear()
  mockConsoleLog.mockClear()

  await copcc(fileOutput)

  expect(mockFileWrite).toBeCalledTimes(1)
  validateMockParams(mockFileWrite, expectedScan)
  expect(mockFileWrite).toHaveReturnedWith(expectedScan)
  expect(mockProcessWrite).toBeCalledTimes(0)
  expect(mockConsoleLog).toBeCalledTimes(2)
})

test('cli deep', async () => {
  const expectedScan = expectScan(await deepScan(filename))

  await copcc(deepArgs)

  expect(mockProcessWrite).toBeCalledTimes(1)
  validateMockParams(mockProcessWrite, expectedScan)
  expect(mockFileWrite).toBeCalledTimes(0)
  mockProcessWrite.mockClear()
  mockConsoleLog.mockClear()

  await copcc(deepScanFileOutput)

  expect(mockFileWrite).toBeCalledTimes(1)
  validateMockParams(mockFileWrite, expectedScan)
  expect(mockFileWrite).toHaveReturnedWith(expectedScan)
  expect(mockProcessWrite).toBeCalledTimes(0)
  expect(mockConsoleLog).toBeCalledTimes(2)
})

test('cli named-reports', async () => {
  const expectedShallow = expectScan(await shallowScan(filename, reportName))

  await copcc(nameArgs)

  expect(mockProcessWrite).toBeCalledTimes(1)
  validateMockParams(mockProcessWrite, expectedShallow)
  expect(mockFileWrite).toBeCalledTimes(0)
  mockProcessWrite.mockClear()

  const expectedDeep = expectScan(await deepScan(filename, reportName))

  await copcc(deepNameArgs)

  expect(mockProcessWrite).toBeCalledTimes(1)
  validateMockParams(mockProcessWrite, expectedDeep)
  expect(mockFileWrite).toBeCalledTimes(0)
  mockProcessWrite.mockClear()
})

test('cli errors', async () => {
  // no args, can't get .toThrow() to work for some reason?
  // expect(() => {
  //   copcc([])
  // }).toThrow('Not enough argument(s) provided')
  //
  // no source file provided, still having .toThrow() issues
  // expect(async () => {
  //   await copcc(['--deep', '--output', outputPath])
  // }).toThrow('Must provide at least one (1) file to be validated')
  mockConsoleLog.mockClear()

  // force 'fs' error
  mockFileWrite.mockImplementationOnce(() => {
    throw new Error('Mock Error')
  })
  // silence console.error() in copcc()
  const mockConsoleError = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {})

  await copcc(fileOutput)

  expect(mockFileWrite).toBeCalledTimes(1)
  expect(mockFileWrite).toThrow()
  expect(mockConsoleLog).toBeCalledTimes(1)
  expect(mockConsoleError).toBeCalledTimes(1)
  // only one console.log() since 'Report successfully written...' is skipped
  // but console.log() still happens for my 'Scan time' message
})

const expectScan = (r: Report.Report) =>
  expect.objectContaining({
    ...r,
    scan: {
      type: r.scan.type,
      filetype: r.scan.filetype,
      start: expect.any(String),
      end: expect.any(String),
      time: expect.any(Number),
    },
  })

const validateMockParams = (
  mockFn: jest.SpyInstance<void, any> | jest.SpyInstance<boolean, any>,
  expectedReport: ReturnType<typeof expectScan>,
) =>
  typeof mockFn.mock.results[0].value === 'boolean'
    ? // mockFn is mockProcessWrite
      expect(JSON.parse(mockFn.mock.calls[0][0])).toEqual(expectedReport)
    : // mockFn is mockFileWrite
      expect(JSON.parse(mockFn.mock.calls[0][1])).toEqual(expectedReport)
