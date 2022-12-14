// import { difference } from 'lodash'
// import difference from 'lodash/difference'
import difference from 'lodash.difference'
import { Check } from 'types'

export const findCheck = (checks: Check[], id: string) =>
  checks.find((c) => c.id === id)

export const splitChecks = (
  checks: Check[],
  isValid: (c: Check) => boolean = (c) => c.status === 'pass',
): [Check[], Check[]] =>
  checks.reduce<[Check[], Check[]]>(
    ([pass, fail], check) =>
      isValid(check) ? [[...pass, check], fail] : [pass, [...fail, check]],
    [[], []],
  )

export const getCheckIds = (checks: Check[]): string[] =>
  checks.reduce<string[]>((prev, curr) => [...prev, curr.id], [])

export const checkAll = (checks: Check[], pass = true) =>
  checks.forEach((check) =>
    pass
      ? expect(check).toHaveProperty('status', 'pass')
      : expect(check).not.toHaveProperty('status', 'pass'),
  )

export const collectionToIds = async (
  collection: Promise<Check.Suite.Collection> | Check.Suite.Collection,
) =>
  (
    await Promise.all(
      (
        await collection
      ).map(async (s) => {
        const { suite } = await s
        return Object.keys(suite)
      }),
    )
  ).flat()

type expectedCheckParams = {
  collection: Promise<Check.Suite.Collection> | Check.Suite.Collection
  expected: string[]
}
/**
 *
 * @param p
 * @param p.collection
 * @param p.expected
 * @returns `[allIds - expected, expected]`
 */
export const expectedChecks = async ({
  collection,
  expected,
}: expectedCheckParams): Promise<[string[], string[]]> => {
  const allIds = await collectionToIds(collection)
  return [difference(allIds, expected), expected]
}
