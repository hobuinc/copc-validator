import { Check } from 'types'
import { flattenDeep, map } from 'lodash'

export * from './copc'
export * from './las'

export const performCheck = <T>(
  s: T,
  f: Check.Function<T>,
  id: string,
): Check => {
  const result = f(s)
  if (typeof result === 'boolean')
    return { id, status: result ? 'pass' : 'fail' }
  const { status, info } = result
  return { id, status, info }
}

export const mapChecks = <T>(s: T, g: Check.Group<T>): Check[] =>
  map(g, (check, id) => performCheck(s, check, id))

export const generateChecks = <T>(s: T, g: Check.Groups<T>): Check[] =>
  flattenDeep(map(g, (checks) => mapChecks(s, checks)))
