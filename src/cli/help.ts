// ========== OPTIONS HERE ==========
type flag = { flag: string; description: string; default?: string }
const flags: flag[] = [
  {
    flag: '-d, --deep',
    description: 'Scan all (versus root) points of each node',
    default: 'false',
  },

  {
    flag: '-n, --name',
    description: 'Title for report output',
    default: '<path>',
  },
  {
    flag: '-m, --mini',
    description: 'Omit extended COPC/LAS info from report',
    default: 'false',
  },
  {
    flag: '-P, --pdal',
    description:
      'Display Header, VLR, and SRS data as pdal info metadata format',
    default: 'false',
  },
  {
    flag: '-w, --workers',
    description: 'Max thread count for scanning Hierarchy Nodes',
    default: 'CPU-count',
  },
  {
    flag: '-q, --queue',
    description: 'Max number of nodes to be queued at a time', // (recommended: multiple of 'workers')
    default: 'Unlimited',
  },
  {
    flag: '-s, --sample',
    description:
      'Select a random sample of <n> nodes to perform PDR checks [NOTE: Not a comprehensive validation report]',
    default: 'All nodes', //\n                    /
  },
  {
    flag: '-p, --progress',
    description: 'Show a progress bar while reading the point data',
    default: 'false',
  },
  {
    flag: '-o, --output',
    description: 'Path to write report as JSON file',
    default: 'stdout',
  },
  { flag: '-h, --help', description: 'Output this help information' },
  { flag: '-v, --version', description: 'Output copcc version' },
]

const space = (n: number) => Array(n > 0 ? n + 1 : 1).join(' ')
export const helpString = (col: number) => {
  const columns = col > 180 ? 180 : col
  let message = `
   Usage: copcc [options] <path>   

   Scans a COPC/LAS file to verify the data matches the filetype specifications.

   <path>           Path to file to attempt validation scan (Note: absolute or relative to PWD)

   Options:${space(columns - 26)}*all optional*

`
  const longestDefault: number = flags.reduce((prev, curr) => {
    if (curr.default && curr.default.length > prev) return curr.default.length
    return prev
  }, 0)

  flags.forEach(({ flag, description, default: d }) => {
    const row = `   ${flag}${space(17 - flag.length)}${description} ${space(
      columns - 40 - description.length,
    )}${d ? `default: ${space(longestDefault - d.length)}${d}` : ''} `
    message += row + '\n'
  })
  return message
}
