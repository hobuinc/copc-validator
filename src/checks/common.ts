import type { Copc } from 'copc'
import { Check, StatusWithInfo } from 'types'
import { map, omit, get } from 'lodash'

type checkFn = {
  id: number
  f: ((a: any) => boolean) | ((a: any) => StatusWithInfo)
}

type checkGenerator = <T>(
  c: Copc,
  checks: ChecksDictionary,
  section: string,
) => Check[]

export type ChecksDictionary = {
  generate: checkGenerator
  [x: string]: checkFn | checkGenerator
}

const generateCheck =
  <T>(makeName: (n: string) => string) =>
  (
    p: T,
    f: (p: T) => boolean | StatusWithInfo,
    id: number,
    name: string,
  ): Check => {
    const result = f(p)
    if (typeof result === 'boolean')
      return { id, name: makeName(name), status: f(p) ? 'pass' : 'fail' }
    const { status, info } = result
    return { id, name: makeName(name), status, info }
  }

export const generatorMap =
  (makeName: (n: string) => string = (n) => n) =>
  (c: Copc, checks: ChecksDictionary, section: string) =>
    map(omit(checks, 'generate'), (func, param) => {
      const { f, id } = func as checkFn
      return generateCheck(makeName)(
        get(c, [section, param]),
        f as (y: any) => boolean,
        id,
        `${section}.${param}`,
      )
    })
