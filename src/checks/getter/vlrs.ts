import { Getter, Las } from 'copc'
import { Check } from 'types'
import vlrSuite from 'checks/las/vlrs'

export const vlrs = async (
  get: Getter,
  info: Las.Vlr.OffsetInfo,
): Check.Suite.Nested<{
  header: Las.Vlr.OffsetInfo
  vlrs: Las.Vlr[]
}> => {
  try {
    const vlrs = await Las.Vlr.walk(get, info)
    return { source: { header: info, vlrs }, suite: vlrSuite }
  } catch (error) {
    throw error
    // TODO: Check VLR data manually for possible errors
  }
}

export default vlrs
