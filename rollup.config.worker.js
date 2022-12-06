import commonjs from '@rollup/plugin-commonjs'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import typescript from '@rollup/plugin-typescript'
import nodeResolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
// import { uglify } from 'rollup-plugin-uglify'

export default {
  input: 'src/utils/worker.js',
  output: {
    file: 'bundles/worker.js',
    format: 'umd',
    name: 'Worker',
    globals: {
      'cross-fetch': 'cross-fetch',
      fs: 'fs',
      path: 'path',
      url: 'url',
    },
  },
  external: ['cross-fetch', 'fetch', 'fs', 'path'],
  plugins: [
    nodeResolve(),
    typescript({
      // tsconfig: './tsconfig.production.json',
      // This will put the declarations at the top level of our output, which is
      // ./lib.  Otherwise it sticks them in ./lib/lib for some reason.
      // declarationDir: '.',
    }),
    commonjs(),
    nodePolyfills(),
    json(),
    // uglify(),
  ],
}
