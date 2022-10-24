import { difference } from 'lodash'
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

export const checkAll = (checks: Check[], pass: boolean = true) =>
  checks.forEach((check) =>
    pass
      ? expect(check).toHaveProperty('status', 'pass')
      : expect(check).not.toHaveProperty('status', 'pass'),
  )

export const allCheckIds = async (
  collection: Promise<Check.Suite.Collection>,
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
  collection: Promise<Check.Suite.Collection>
  expectedFailed: string[]
}
export const expectedChecks = async ({
  collection,
  expectedFailed,
}: expectedCheckParams): Promise<[string[], string[]]> => {
  const allIds = await allCheckIds(collection)
  return [difference(allIds, expectedFailed), expectedFailed]
}
