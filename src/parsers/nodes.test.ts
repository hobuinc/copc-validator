import { Copc, Getter } from 'copc'
import { ellipsoidFiles, getCopcItems, maxThreads } from 'test'
import { checkAll, invokeAllChecks } from 'utils'
import nodeParser from './nodes'

const items = getCopcItems()

test('shallowNodeScan all-pass', async () => {
  const { filepath, get, copc } = await items
  const checks = await invokeAllChecks(
    await nodeParser({ get, copc, filepath, showProgress: true }), //default arguments
  )
  checkAll(checks)
})

test('shallowNodeScan failure', async () => {
  const filepath = ellipsoidFiles.laz14
  const get = Getter.create(filepath)
  const copc = {} as Copc
  const deep = false

  await expect(
    nodeParser({ get, copc, filepath, deep, workerCount: maxThreads }),
  ).rejects.toThrow() //different messages per node version
})

test('deepNodeScan all-pass', async () => {
  const { filepath, get, copc } = await items
  const checks = await invokeAllChecks(
    await nodeParser({
      get,
      copc,
      filepath,
      deep: true,
      workerCount: maxThreads,
      showProgress: true,
    }),
  )
  checkAll(checks)
})

test('deepNodeScan failures', async () => {
  const filepath = ellipsoidFiles.laz14
  const get = Getter.create(filepath)
  const copc = {} as Copc
  const deep = true

  await expect(
    nodeParser({ get, copc, filepath, deep, workerCount: maxThreads }),
  ).rejects.toThrow()
})
