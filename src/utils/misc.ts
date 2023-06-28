import { WorkerSettings } from './pool'

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
  worker: WorkerSettings
} = {
  lazPerf:
    typeof process === 'object'
      ? undefined
      : (function () {
          let origin = window.origin + window.location.pathname
          if (origin.endsWith('index.html')) {
            origin = origin.slice(0, origin.lastIndexOf('index.html'))
          }
          return origin + 'laz-perf.wasm'
        })(),
  worker:
    typeof process === 'object'
      ? ['./workers/worker', { type: 'module' }] //module worker in node
      : [
          //new URL('./workers/worker.umd.js', import.meta.url).href,
          './workers/worker.umd.js',
          { type: 'classic' },
        ], //classic worker in browser (for non-Chrome support)
}
