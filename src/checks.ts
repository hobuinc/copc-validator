import type { Copc } from 'copc'
import { get, map, flattenDeep, omit } from 'lodash'
import { Check, StatusWithInfo } from 'types'

type checkFn = ((a: any) => boolean) | ((a: any) => StatusWithInfo)

type checkGenerator = <T>(
  p: T,
  f: (p: T) => boolean | StatusWithInfo,
  id: number,
  name: string,
) => Check

type checksDict = {
  generate: checkGenerator
  [x: string]: checkFn | checkGenerator
}

const makeGenerate =
  <T>(makeName: (n: string) => string = (n) => n) =>
  (
    p: T,
    f: (p: T) => boolean | StatusWithInfo,
    id: number,
    name: string,
  ): Check => {
    const result = f(p)
    if (typeof result === 'boolean')
      return { id, name, status: f(p) ? 'pass' : 'fail' }
    const { status, info } = result
    return { id, name: makeName(name), status, info }
  }

const headerChecks: checksDict = {
  fileSignature: (f: string) => f === 'LASF',
  majorVersion: (v: number) => v === 1,
  minorVersion: (v: number) => v === 4,
  pointDataRecordFormat: (p: number) => [6, 7, 8].includes(p),
  // generate: <T = string | number>(
  //   p: T,
  //   f: (p: T) => boolean | StatusWithInfo,
  //   id: number,
  //   name: string,
  // ): Check => {
  //   return { id, name: name + ' match', status: f(p) ? 'pass' : 'fail' }
  // },
  generate: makeGenerate((n) => `${n} match`),
}
// const vlrsChecks: checksDict = {}
const infoChecks: checksDict = {
  gpsTimeRange: (g: [number, number]) => {
    return {
      status: g[0] <= g[1] ? 'pass' : 'fail',
      info: 'GPSTime lower <= GPSTime upper',
    } as unknown as boolean
  },
  // generate: <T = [number, number]>(
  //   p: T,
  //   f: (p: T) => boolean | StatusWithInfo,
  //   id: number,
  //   name: string,
  // ): Check => {
  //   const result = f(p)
  //   if (typeof result === 'boolean')
  //     return { id, name, status: f(p) ? 'pass' : 'fail' }
  //   const { status, info } = result
  //   return { id, name, status, info }
  // },
  generate: makeGenerate(),
}
const checkFns = {
  header: headerChecks,
  // vlrs: vlrsChecks,
  info: infoChecks,
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
          `${section}.${param}`,
        ),
      ),
    ),
  )
}
