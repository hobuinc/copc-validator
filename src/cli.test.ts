import copcc, { fs, writeHelp } from './cli'
import generateReport from 'report'
import { ellipsoidFiles } from 'test'
import { Report } from 'types'

const filename = ellipsoidFiles.copc
const outputPath = 'output.json'
const reportName = 'report-name'

const shallowScan = generateReport(filename, {})
const deepScan = generateReport(filename, { deep: true })

afterEach(() => jest.clearAllMocks())
afterAll(() => jest.restoreAllMocks())

// ========== TESTS ==========
test('cli shallow', async () => {
  const expectedScan = expectScan(await shallowScan) //await generateReport(filename, {}))

  await validateGoodScan([filename], expectedScan)
  await validateGoodScan([filename, '-o', outputPath], expectedScan)
  // shallow scans are fast enough that it's better not to split them
})

// test('cli shallow file-output', async () => {
//   const expectedScan = expectScan(await shallowScan) //await generateReport(filename, {}))

//   await validateGoodScan([filename, '-o', outputPath], expectedScan)
// })

test('cli deep', async () => {
  jest.setTimeout(20000)
  const expectedScan = expectScan(
    await deepScan, //await generateReport(filename, { deep: true }),
  )

  await validateGoodScan([filename, '--deep'], expectedScan)
  // await validateGoodScan([filename, '-d', '--output', outputPath], expectedScan)
})

test('cli deep file-output', async () => {
  jest.setTimeout(20000)
  const expectedScan = expectScan(
    await deepScan, //await generateReport(filename, { deep: true }),
  )

  // await validateGoodScan([filename, '--deep'], expectedScan)
  await validateGoodScan([filename, '-d', '--output', outputPath], expectedScan)
})

test('cli help', async () => {
  await copcc(['-h'])
  expect(mockProcessWrite).toBeCalledTimes(1)
  expect(mockProcessWrite).toBeCalledWith(writeHelp(process.stdout.columns))
  mockProcessWrite.mockClear()

  process.stdout.columns = 100

  await copcc(['--help'])
  expect(mockProcessWrite).toBeCalledTimes(1)
  expect(mockProcessWrite).toBeCalledWith(writeHelp(100))
  mockProcessWrite.mockClear()

  process.stdout.columns = 200

  await copcc(['-help', filename])
  expect(mockProcessWrite).toBeCalledTimes(1)
  expect(mockProcessWrite).toBeCalledWith(writeHelp(200))
  mockProcessWrite.mockClear()
})

test('cli mini', async () => {
  // const expectedScan = expectScan(
  //   await generateReport(filename, { mini: true }),
  // )
  const {
    name,
    scan: { type, filetype },
    checks,
  } = await generateReport(filename, { mini: true })
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
  // mockProcessWrite.mockClear()

  await validateGoodScan([filename, '--mini'], expectedScan)
  await validateGoodScan([filename, '-m'], expectedScan)
})

test('cli errors', async () => {
  // no args provided
  await expect(copcc([])).rejects.toThrow('Not enough argument(s) provided')

  // no source file provided
  await expect(copcc(['--deep', '--output', outputPath])).rejects.toThrow(
    'Must provide a filepath to be validated',
  )

  // multiple filepaths
  await expect(copcc([filename, ellipsoidFiles.laz14])).rejects.toThrow(
    'Too many arguments (filepaths) provided',
  )

  // silence console.error() in copcc() since we don't currently care about it
  const mockConsoleError = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {})
  mockFileWrite.mockClear()
  // force 'fs' error
  mockFileWrite.mockImplementationOnce(() => {
    throw new Error('Mock Error')
  })

  await copcc([filename, `-o=${outputPath}`])

  expect(mockFileWrite).toBeCalledTimes(1)
  expect(mockFileWrite).toThrow()
  expect(mockConsoleLog).toBeCalledTimes(1)
  expect(mockConsoleError).toBeCalledTimes(1)
  // only one console.log() since 'Report successfully written...' is skipped
  // but console.log() still happens for the debug 'Scan time' message
})

test('cli named-reports', async () => {
  jest.setTimeout(10000)
  const expectedShallow = expectScan(
    await generateReport(filename, { name: reportName }),
  )
  await validateGoodScan([filename, '--name', reportName], expectedShallow)

  const expectedDeep = expectScan(
    await generateReport(filename, { name: reportName, deep: true }),
  )
  await validateGoodScan([filename, '-d', `--name=${reportName}`], expectedDeep)
})

// ========== MOCKS ==========

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
    expect(mockProcessWrite).toBeCalledTimes(0)
    expect(mockConsoleLog).toBeCalledTimes(2)
    mockFileWrite.mockClear()
    mockConsoleLog.mockClear()
  } else {
    expect(mockProcessWrite).toBeCalledTimes(1)
    validateMockParams(mockProcessWrite, expected)
    expect(mockFileWrite).toBeCalledTimes(0)
    expect(mockConsoleLog).toBeCalledTimes(1)
    mockProcessWrite.mockClear()
    mockConsoleLog.mockClear()
  }
}

const validateMockParams = (
  mockFn: jest.SpyInstance<void, any> | jest.SpyInstance<boolean, any>,
  expected: ReturnType<typeof expectScan>,
) =>
  typeof mockFn.mock.results[0].value === 'boolean'
    ? // mockFn is mockProcessWrite
      expect(JSON.parse(mockFn.mock.calls[0][0])).toEqual(expected)
    : // mockFn is mockFileWrite
      expect(JSON.parse(mockFn.mock.calls[0][1])).toEqual(expected)

// ReturnType<typeof expectScan> is actually just `any` which doesn't help much,
// but I'm using it anyway since it gives the illusion of typing with the reports
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
