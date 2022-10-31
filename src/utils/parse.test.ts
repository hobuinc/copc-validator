import { Copc, Getter } from 'copc'
import { getCopcItems } from 'test'
import { formatGuid, loadAllHierarchyPages, parsePoint } from './parse'

test('loadAllHierarchyPages', async () => {
  const { get, copc } = await getCopcItems()
  expect(await loadAllHierarchyPages(get)).toEqual(
    await loadAllHierarchyPages(get, copc),
  )
  expect(loadAllHierarchyPages(get, {} as Copc)).rejects.toThrow()
  expect(loadAllHierarchyPages(Getter.create(__filename))).rejects.toThrow()
})

test('branch coverage', () => {
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
