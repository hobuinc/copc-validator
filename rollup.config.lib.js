import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import threads from 'rollup-plugin-threads'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import json from '@rollup/plugin-json'

export default {
  input: 'src/exports.ts',
  output: {
    file: 'bundles/exports.js',
    format: 'umd',
    name: 'Copc-Validator',
    // globals: {
    //   'cross-fetch': 'cross-fetch',
    //   fs: 'fs',
    //   path: 'path',
    //   url: 'url',
    // },
  },
  // external: ['cross-fetch', 'fetch', 'fs', /node_modules/],
  // external: [/node_modules/],
  plugins: [
    nodeResolve(),
    typescript({
      tsconfig: './tsconfig.lib.json',
      // This will put the declarations at the top level of our output, which is
      // ./lib.  Otherwise it sticks them in ./lib/lib for some reason.
      declarationDir: '.',
    }),
    commonjs(),
    // nodePolyfills(),
    threads({
      include: ['./src/utils/worker.js'],
      verbose: true,
      // plugins: [
      //   nodeResolve(),
      //   typescript({
      //     // tsconfig: './tsconfig.production.json',
      //     // This will put the declarations at the top level of our output, which is
      //     // ./lib.  Otherwise it sticks them in ./lib/lib for some reason.
      //     // declarationDir: '.',
      //   }),
      //   commonjs(),
      //   nodePolyfills(),
      //   json(),
      // ],
    }),
    // postcss({
    //   autoModules: true,
    //   extensions: ['.css', '.scss'],
    //   extract: true,
    // }),
    // json(),
  ],
}
