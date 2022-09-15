import { generatorMap, BasicChecksDictionary } from './common'

const header: BasicChecksDictionary = {
  fileSignature: { id: 0, f: (f: string) => f === 'LASF' },
  majorVersion: { id: 1, f: (v: number) => v === 1 },
  minorVersion: { id: 2, f: (v: number) => v === 4 },
  pointDataRecordFormat: { id: 3, f: (p: number) => [6, 7, 8].includes(p) },
  generate: generatorMap((n) => `${n} match`),
}

export default header
