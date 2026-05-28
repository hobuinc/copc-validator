export const Pool = { all, allSettled }

type F<T> = () => Promise<T>
async function all<T>(list: F<T>[], limit = Infinity) {
  const results: Promise<T>[] = []
  const running: Promise<void>[] = []
  for (const f of list) {
    const execution = f()
    results.push(execution)

    const watcher: Promise<void> = execution
      .then(() => {
        running.splice(running.indexOf(watcher), 1)
      })
      .catch(() => {})
    running.push(watcher)

    if (running.length >= limit) await Promise.race(running)
  }
  return Promise.all(results)
}

type Options = { limit?: number; signal?: AbortSignal }
async function allSettled<T>(
  list: F<T>[],
  { limit = Infinity, signal }: Options,
) {
  const results: Promise<T>[] = []
  const running: Promise<void>[] = []
  for (const f of list) {
    if (signal?.aborted) break

    const execution = f()
    results.push(execution)

    const watcher: Promise<void> = execution
      .then(() => {})
      .catch(() => {})
      .finally(() => {
        running.splice(running.indexOf(watcher), 1)
      })
    running.push(watcher)

    if (running.length >= limit) await Promise.race(running)
  }
  return Promise.allSettled(results)
}
