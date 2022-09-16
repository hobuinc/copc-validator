import { Check } from 'types'

const info: Check.Group = {
  'info.gpsTimeRange': (c) => c.info.gpsTimeRange[0] <= c.info.gpsTimeRange[1],
}

export default info
