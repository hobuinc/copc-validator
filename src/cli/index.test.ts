import { copcc, fs, helpString } from '.'
import { generateReport } from 'report' //'../report/index.js'
import { ellipsoidFiles } from 'test' //'../test/index.js'
import { Report } from 'types' //'../types/index.js'

const filename = ellipsoidFiles.copc
const outputPath = 'output.json'
const reportName = 'report-name'
const copcVersion: string = process.env.npm_package_version || 'vX.X.X'

const deepScan = generateReport({ source: filename, options: { deep: true } })

afterEach(() => import.meta.jest.clearAllMocks())
afterAll(() => import.meta.jest.restoreAllMocks())

// ========== TESTS ==========
test('cli shallow', async () => {
  const expectedScan = expectScan(
    await generateReport({ source: filename, options: {} }),
  )

  await validateGoodScan([filename], expectedScan)
  await validateGoodScan([filename, '-o', outputPath], expectedScan)
  // shallow scans are fast enough that it's better not to split them
})

test('cli deep', async () => {
  import.meta.jest.setTimeout(20000)
  const expectedScan = expectScan(
    await deepScan, //await generateReport(filename, { deep: true }),
  )

  await validateGoodScan([filename, '--deep'], expectedScan)
  // await validateGoodScan([filename, '-d', '--output', outputPath], expectedScan)
})

test('cli deep file-output', async () => {
  import.meta.jest.setTimeout(20000)
  const expectedScan = expectScan(
    await deepScan, //await generateReport(filename, { deep: true }),
  )

  // await validateGoodScan([filename, '--deep'], expectedScan)
  await validateGoodScan([filename, '-d', '--output', outputPath], expectedScan)
})

test('cli help', async () => {
  await copcc(['-h'])
  expect(mockProcessWrite).toBeCalledTimes(1)
  expect(mockProcessWrite).toBeCalledWith(helpString(process.stdout.columns))
  mockProcessWrite.mockClear()

  process.stdout.columns = 100

  await copcc(['--help'])
  expect(mockProcessWrite).toBeCalledTimes(1)
  expect(mockProcessWrite).toBeCalledWith(helpString(100))
  mockProcessWrite.mockClear()

  process.stdout.columns = 200

  await copcc(['-help', filename])
  expect(mockProcessWrite).toBeCalledTimes(1)
  expect(mockProcessWrite).toBeCalledWith(helpString(200))
  mockProcessWrite.mockClear()
})

test('cli version', async () => {
  // basic usage
  await copcc(['--version'])
  expect(mockProcessWrite).toBeCalledTimes(1)
  expect(mockProcessWrite).toBeCalledWith(copcVersion + '\n')
  mockProcessWrite.mockClear()

  // setting --version overwrites other settings
  await copcc(['-vdm', filename])
  expect(mockProcessWrite).toBeCalledTimes(1)
  expect(mockProcessWrite).toBeCalledWith(copcVersion + '\n')
  mockProcessWrite.mockClear()

  // --help overwrites --version
  await copcc(['-vh', `--output=${outputPath}`])
  expect(mockProcessWrite).toBeCalledTimes(1)
  expect(mockProcessWrite).toBeCalledWith(helpString(process.stdout.columns))
  mockProcessWrite.mockClear()
})

test('cli mini', async () => {
  const {
    name,
    scan: { type, filetype },
    checks,
  } = await generateReport({ source: filename, options: { mini: true } })
  const expectedScan = expect.objectContaining({
    name,
    checks,
    scan: {
      type,
      filetype,
      start: expect.any(String),
      end: expect.any(String),
      time: expect.any(Number),
    },
  })

  await validateGoodScan([filename, '--mini'], expectedScan)
  await validateGoodScan([filename, '-m'], expectedScan)
})

test('cli errors', async () => {
  // no args provided
  await copcc([])
  expect(mockProcessWrite).toBeCalledTimes(2)
  expect(mockProcessWrite).toHaveBeenNthCalledWith(
    1,
    'ERROR: Not enough argument(s) provided\n',
  )
  expect(mockProcessWrite).toHaveBeenNthCalledWith(
    2,
    helpString(process.stdout.columns),
  )
  mockProcessWrite.mockClear()

  // no source file provided
  await copcc(['--deep', '--output', outputPath])
  expect(mockProcessWrite).toBeCalledTimes(2)
  expect(mockProcessWrite).toHaveBeenNthCalledWith(
    1,
    'ERROR: Must provide a filepath to be validated\n',
  )
  expect(mockProcessWrite).toHaveBeenNthCalledWith(
    2,
    helpString(process.stdout.columns),
  )
  mockProcessWrite.mockClear()

  // multiple filepaths
  await copcc([filename, ellipsoidFiles.laz14])
  expect(mockProcessWrite).toBeCalledTimes(2)
  expect(mockProcessWrite).toHaveBeenNthCalledWith(
    1,
    'ERROR: Too many arguments (filepaths) provided\n',
  )
  expect(mockProcessWrite).toHaveBeenNthCalledWith(
    2,
    helpString(process.stdout.columns),
  )
  mockProcessWrite.mockClear()

  // silence console.error() in copcc() since we don't currently care about it
  const mockConsoleError = import.meta.jest
    .spyOn(console, 'error')
    .mockImplementation(() => {}) //eslint-disable-line
  mockFileWrite.mockClear()
  // force 'fs' error
  mockFileWrite.mockImplementationOnce(() => {
    throw new Error('Mock Error')
  })

  await copcc([filename, `-o=${outputPath}`])

  expect(mockFileWrite).toBeCalledTimes(1)
  expect(mockFileWrite).toThrow()
  expect(mockConsoleLog).toBeCalledTimes(0)
  expect(mockConsoleError).toBeCalledTimes(1)
})

test('cli named-reports', async () => {
  import.meta.jest.setTimeout(10000)
  const expectedShallow = expectScan(
    await generateReport({ source: filename, options: { name: reportName } }),
  )
  await validateGoodScan([filename, '--name', reportName], expectedShallow)

  const expectedDeep = expectScan(
    await generateReport({
      source: filename,
      options: { name: reportName, deep: true },
    }),
  )
  await validateGoodScan([filename, '-d', `--name=${reportName}`], expectedDeep)
})

// ========== MOCKS ==========
const mockConsoleLog = import.meta.jest
  .spyOn(console, 'log')
  .mockImplementation(() => {}) //eslint-disable-line
const mockProcessWrite = import.meta.jest
  .spyOn(process.stdout, 'write')
  .mockImplementation(() => true)
  .mockName('process.write')
const mockFileWrite = import.meta.jest
  .spyOn(fs, 'writeFileSync')
  .mockImplementation((_file, data) =>
    JSON.parse(typeof data === 'string' ? data : data.toString()),
  )
  .mockName('fs.writeFileSync')

// ========== UTILITIES ==========

const validateGoodScan = async (
  args: string[],
  expected: ReturnType<typeof expectScan>,
) => {
  await copcc(args)
  if (args.toString().includes('-o')) {
    expect(mockFileWrite).toBeCalledTimes(1)
    validateMockParams(mockFileWrite, expected)
    expect(mockFileWrite).toHaveReturnedWith(expected)
    expect(mockProcessWrite).toBeCalledTimes(1)
    expect(mockProcessWrite).toBeCalledWith(
      expect.stringContaining(`Report successfully written to`),
    )
    mockFileWrite.mockClear()
    mockConsoleLog.mockClear()
  } else {
    expect(mockProcessWrite).toBeCalledTimes(1)
    validateMockParams(mockProcessWrite, expected)
    expect(mockFileWrite).toBeCalledTimes(0)
    expect(mockConsoleLog).toBeCalledTimes(0)
    mockProcessWrite.mockClear()
    mockConsoleLog.mockClear()
  }
}

// ReturnType<typeof expectScan> is actually just `any` which doesn't help much,
// but I'm using it anyway since it gives the illusion of typing with the reports
const validateMockParams = (
  mockFn: jest.SpyInstance<void | boolean, any>, //eslint-disable-line
  expected: ReturnType<typeof expectScan>,
) =>
  typeof mockFn.mock.results[0].value === 'boolean'
    ? // mockFn is mockProcessWrite
      expect(JSON.parse(mockFn.mock.calls[0][0] as string)).toEqual(expected)
    : // mockFn is mockFileWrite
      expect(JSON.parse(mockFn.mock.calls[0][1] as string)).toEqual(expected)

export const expectScan = (r: Report) =>
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
