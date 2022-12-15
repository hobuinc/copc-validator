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
export const Paths = {
  lazPerf:
    typeof process === 'object'
      ? 'laz-perf.wasm' // new URL('./workers/laz-perf.wasm', import.meta.url).href //
      : window.origin + '/laz-perf.wasm',
}

export const NodeVsBrowser: { worker: [string, ThreadsWorkerOptions] } = {
  worker:
    typeof process === 'object'
      ? ['./workers/worker.js', { type: 'module' }]
      : [
          new URL('./workers/worker.umd.js', import.meta.url).href,
          { type: 'classic' },
        ],
}
