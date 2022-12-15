import { SingleBar } from 'cli-progress'
import { Copc, Hierarchy } from 'copc'
import { spawn, Pool, Worker } from 'threads'
import { AllNodesChecked, CheckedNode } from 'types'
import { NodeVsBrowser } from './misc.js'

type workerParams = {
  file: string | File
  copc: Copc
  key: string
  node: Hierarchy.Node
  deep: boolean
  lazPerfWasmFilename: string
}
type workerResult = [string, CheckedNode]
type workerFunction = (p: workerParams) => workerResult

export const runTasks = async (
  tasks: workerParams[],
  withBar: boolean,
  workerCount?: number,
) => {
  // setup thread pool
  const pool = Pool(
    () => spawn<workerFunction>(new Worker(...NodeVsBrowser.worker)),
    workerCount,
  )
  const results: workerResult[] = []

  const { queueTasks, terminate } = (() => {
    if (withBar) {
      // setup cli-progress bar
      const { deep, copc } = tasks[0]
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
          for (const task of tasks) {
            pool.queue(async (worker) => {
              const r = await worker(task)
              // increment bar as nodes are returned
              bar.increment(deep ? r[1].pointCount : 1)
              results.push(r)
            })
          }
        },
        terminate: async () => {
          await pool.completed()
          await pool.terminate()
          // stop bar when tasks complete
          bar.stop()
        },
      }
    }
    // if withBar === false
    return {
      queueTasks: async () => {
        for (const task of tasks) {
          pool.queue(async (worker) => {
            const r = await worker(task)
            results.push(r)
          })
        }
      },
      terminate: async () => {
        await pool.completed()
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
