import type { Copc } from 'copc'
import { Check, StatusWithInfo } from 'types'
import { map, omit, get } from 'lodash'

export const Messages = {
  moreInfoOnFullScan: 'Run a Full Scan for more information',
}

export type checkFn<T = any> = {
  id: number
  f:
    | ((a: T) => boolean)
    | ((a: T) => StatusWithInfo)
    | ((a: T) => boolean | StatusWithInfo)
}

export type checkGenerator = (
  c: Copc,
  checks: BasicChecksDictionary,
  section: string,
) => Check[]

export type BasicChecksDictionary<T = any> = {
  generate: checkGenerator
  [x: string]: checkFn<T> | checkGenerator
}

const generateCheck = <T>(
  p: T,
  f: (p: T) => boolean | StatusWithInfo,
  id: number,
  name: string,
): Check => {
  const result = f(p)
  if (typeof result === 'boolean')
    return { id, name, status: result ? 'pass' : 'fail' }
  const { status, info } = result
  return { id, name, status, info }
}

export const generatorMap =
  <T = any>(makeName: (n: string) => string = (n) => n) =>
  (c: Copc, checks: BasicChecksDictionary<T>, section: string) =>
    map(omit(checks, 'generate'), (func, param) => {
      const { f, id } = func as checkFn<T>
      return generateCheck<T>(
        get(c, [section, param]),
        f as (y: T) => boolean,
        id,
        makeName(`${section}.${param}`),
      )
    })
