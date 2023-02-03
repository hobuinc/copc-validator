import { SingleBar } from 'cli-progress'
import { Copc, Hierarchy } from 'copc'
import { spawn, Pool, Worker } from 'threads'
// import { defaultPoolSize } from 'threads/dist/master/implementation'
import { AllNodesChecked, CheckedNode } from 'types'
import { NodeVsBrowser } from './misc.js'

export type workerParams = {
  file: string | File
  copc: Copc
  key: string
  node: Hierarchy.Node
  lazPerfWasmFilename: string | undefined
}
type workerResult = [string, CheckedNode]
type processResult = (result: workerResult) => void

type workerModule = {
  shallow({ file, copc, key, node }: workerParams): Promise<workerResult>
  deep({
    file,
    copc,
    key,
    node,
    lazPerfWasmFilename,
  }: workerParams): Promise<workerResult>
}

type runTasksOptions = {
  deep: boolean
  withBar: boolean
  workerCount?: number
  workerConcurrency?: number
  queueLimit?: number
}

export const runTasks = async (
  tasks: workerParams[],
  {
    deep,
    withBar,
    workerCount,
    workerConcurrency,
    queueLimit,
  }: runTasksOptions,
) => {
  // setup thread pool
  const pool = Pool(
    () => spawn<workerModule>(new Worker(...NodeVsBrowser.worker)),
    { size: workerCount, concurrency: workerConcurrency },
  )

  const results: workerResult[] = []

  async function processTasks(processResult: processResult) {
    const running: Promise<void>[] = []
    for (const task of tasks) {
      if (task.node.pointCount === 0)
        results.push([
          task.key,
          {
            ...task.node,
            rgb: 'pass',
            rgbi: 'pass',
            xyz: 'pass',
            gpsTime: 'pass',
            sortedGpsTime: 'pass',
            returnNumber: 'pass',
            zeroPoints: 'warn',
          } as unknown as CheckedNode,
        ])
      else {
        if (!queueLimit) {
          pool
            .queue((worker) =>
              deep ? worker.deep(task) : worker.shallow(task),
            )
            .then(processResult)
        } else {
          const execution = pool
            .queue((worker) =>
              deep ? worker.deep(task) : worker.shallow(task),
            )
            .then(processResult)

          const watcher: Promise<void> = execution
            .then(() => {
              running.splice(running.indexOf(watcher), 1)
            })
            .catch(() => {}) /* eslint-disable-line */
          running.push(watcher)

          if (running.length >= queueLimit) await Promise.race(running)
        }
      }
    }
  }

  const { queueTasks, terminate } = (() => {
    if (!withBar)
      return {
        queueTasks: async () => processTasks((r) => results.push(r)),
        terminate: async () => {
          await pool.completed()
          await pool.terminate()
        },
      }

    // setup cli-progress bar
    const { copc } = tasks[0]
    const count = tasks.length
    const { total, opts } = {
      total: deep ? copc.header.pointCount : count,
      opts: {
        barsize:
          process.stderr.columns > 80
            ? Math.floor(process.stderr.columns / 2)
            : 40,
        etaBuffer: count > 30 ? Math.floor(count / 3) : 10,
      },
    }
    const bar = new SingleBar({
      format: `checking ${
        deep ? 'all' : 'root'
      } points [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`,
      barCompleteChar: '=',
      barIncompleteChar: '-',
      clearOnComplete: true,
      ...opts,
    })

    return {
      queueTasks: async () => {
        bar.start(total, 0)
        return processTasks((r) => {
          bar.increment(deep ? r[1].pointCount : 1)
          results.push(r)
        })
      },
      terminate: async () => {
        await pool.completed()
        bar.stop() // stop bar when tasks complete
        await pool.terminate()
      },
    }
  })()

  // queue all tasks
  await queueTasks()

  // wait for all queued tasks to finish, kill threads
  await terminate()

  // return relevant object
  return results.reduce((acc, [key, node]) => {
    acc[key] = node
    return acc
  }, {} as AllNodesChecked)
}
