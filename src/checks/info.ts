import { generatorMap, BasicChecksDictionary } from './common'

const info: BasicChecksDictionary = {
  gpsTimeRange: {
    id: 100,
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
