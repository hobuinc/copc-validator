import { Check } from 'types'

const info: Check.SyncGroup = {
  'info.gpsTimeRange': (c) => c.info.gpsTimeRange[0] <= c.info.gpsTimeRange[1],
}

export default info
