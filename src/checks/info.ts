import { generatorMap, ChecksDictionary } from './common'

const info: ChecksDictionary = {
  gpsTimeRange: {
    id: 10,
    f: (g: [number, number]) => {
      return {
        status: g[0] <= g[1] ? 'pass' : 'fail',
        info: 'GPSTime lower <= GPSTime upper',
      } as unknown as boolean
    },
  },
  generate: generatorMap(),
}

export default info
