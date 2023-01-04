import { ThreadsWorkerOptions } from 'threads/dist/types/master'

export const currTime =
  typeof performance !== 'undefined'
    ? () => performance.now()
    : () => new Date().getTime()

/**
 * Contains paths to locate the point-data worker and laz-perf.wasm files
 * based on the environment (node vs browser)
 *
 * Could not get node lazPerf path working so Copc just creates its own in node
 */

export const NodeVsBrowser: {
  lazPerf: string | undefined
  worker: [string, ThreadsWorkerOptions]
} = {
  lazPerf:
    typeof process === 'object'
      ? undefined //'laz-perf.wasm'
      : getWasmFilename(), //window.origin + '/laz-perf.wasm',
  worker:
    typeof process === 'object'
      ? ['./workers/worker.js', { type: 'module' }] //module worker in node
      : [
          new URL('./workers/worker.umd.js', import.meta.url).href,
          { type: 'classic' },
        ], //classic worker in browser (for non-Chrome support)
}

function getWasmFilename() {
  let origin = window.origin + window.location.pathname
  if (origin.endsWith('index.html')) {
    origin = origin.slice(0, origin.lastIndexOf('index.html'))
  }
  return origin + 'laz-perf.wasm'
}
