import type { Copc } from 'copc'
import { get, toPairs, map, flattenDeep, forIn, omit } from 'lodash'
import { Report, Check, Unions } from 'types'

type checkGenerator = <T extends string | number>(
  p: T,
  f: (p: T) => boolean, // ) | ((p: T) => { status: Unions.status; info?: any }),
  id: number,
  name: string,
) => Check

type checksDict = {
  generate: checkGenerator
  [x: string]: ((y: any) => boolean) | checkGenerator
}

const headerChecks: checksDict = {
  fileSignature: (f: string) => f === 'LASF',
  majorVersion: (v: number) => v === 1,
  minorVersion: (v: number) => v === 4,
  pointDataRecordFormat: (p: number) => [6, 7, 8].includes(p),
  generate: (
    p: string | number,
    f: (p: any) => boolean,
    id: number | string,
    name: string,
  ): Check => {
    return { id, name, status: f(p) ? 'pass' : 'fail' }
  },
}
//const vlrsChecks: checksDict = {}
// const infoChecks: checksDict = {}
const checkFns = {
  header: headerChecks,
  // vlrs: vlrsChecks,
  // info: infoChecks,
}

export const generateChecks = (c: Copc): Check[] => {
  let i = 0
  return flattenDeep(
    map(checkFns, (checks, section) =>
      map(omit(checks, 'generate'), (f, param) =>
        checks.generate(
          get(c, [section, param]),
          f as (y: any) => boolean,
          i++,
          `${section}.${param} match`,
        ),
      ),
    ),
  )
}
