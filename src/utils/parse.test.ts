import { formatGuid, parsePoint } from './parse'

test('branch coverage', async () => {
  expect(() => {
    formatGuid(new Uint8Array(15))
  }).toThrow('Invalid GUID buffer length')
  expect(formatGuid(new Uint8Array(16))).toEqual(
    '00000000-0000-0000-0000000000000000',
  )
  expect(() => {
    parsePoint(new Uint8Array(25))
  }).toThrow('Invalid tuple buffer length')
  expect(parsePoint(new Uint8Array(24))).toEqual([0, 0, 0])
})
