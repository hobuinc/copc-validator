import commonjs from '@rollup/plugin-commonjs'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import nodeResolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'

export default {
  input: 'src/utils/workers/worker.js',
  output: {
    file: 'lib/utils/workers/worker.umd.js',
    format: 'umd',
    name: 'Worker',
    globals: {
      fs: 'fs',
      path: 'path',
      url: 'url',
    },
  },
  external: ['fs', 'path'],
  plugins: [
    nodeResolve({ browser: true }),
    commonjs(),
    nodePolyfills(),
    json(),
  ],
}
