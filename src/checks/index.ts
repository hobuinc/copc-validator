import { Check } from 'types'
import { flattenDeep, map } from 'lodash'

export * from './copc'
export * from './las'

export const performCheckSync = <T>(
  s: T,
  f: Check.SyncFunction<T>,
  id: string,
): Check => {
  const result = f(s)
  if (typeof result === 'boolean')
    return { id, status: result ? 'pass' : 'fail' }
  const { status, info } = result
  return { id, status, info }
}

export const mapChecks = <T>(s: T, g: Check.SyncGroup<T>): Check[] =>
  map(g, (check, id) => performCheckSync(s, check, id))

export const generateChecks = <T>(s: T, g: Check.Groups<T>): Check[] =>
  flattenDeep(map(g, (checks) => mapChecks(s, checks)))

const performCheckAsync = async <T>(
  s: T,
  f: Check.AsyncFunction<T>,
  id: string,
): Promise<Check> => {
  const result = await f(s)
  if (typeof result === 'boolean')
    return { id, status: result ? 'pass' : 'fail' }
  const { status, info } = result
  return { id, status, info }
}

export const mapAsyncChecks = <T>(
  s: T,
  g: Check.AsyncGroup<T>,
): Promise<Check>[] => map(g, (check, id) => performCheckAsync(s, check, id))
