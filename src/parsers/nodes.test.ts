import { Copc, Getter } from 'copc'
import { ellipsoidFiles, getCopcItems, workerCount } from 'test'
import { checkAll, invokeAllChecks } from 'utils'
import { nodeParser } from './nodes'

const items = getCopcItems()

test('shallowNodeScan all-pass', async () => {
  const { filepath, get, copc } = await items
  process.stderr.columns = 60
  const checks = await invokeAllChecks(
    await nodeParser({ get, copc, file: filepath, showProgress: true }), //default arguments
  )
  checkAll(checks)
})

test('shallowNodeScan failure', async () => {
  const filepath = ellipsoidFiles.laz14
  const get = Getter.create(filepath)
  const copc = {} as Copc
  const deep = false

  await expect(
    nodeParser({ get, copc, file: filepath, deep, workerCount }),
  ).rejects.toThrow() //different messages per node version
})

test('deepNodeScan all-pass', async () => {
  const { filepath, get, copc } = await items
  process.stderr.columns = 100
  const checks = await invokeAllChecks(
    await nodeParser({
      get,
      copc,
      file: filepath,
      deep: true,
      workerCount,
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
    nodeParser({ get, copc, file: filepath, deep, workerCount }),
  ).rejects.toThrow()
})
