// @ts-check

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { bold, green } from './colors.mjs'
import { readJSONFile } from './fs.mjs'
import { createLogger } from './logger.mjs'

const args = process.argv.slice(2)

/** @satisfies {import('node:util').ParseArgsConfig['options']} */
export const options = {
  version: {
    type: 'boolean',
    short: 'v',
    // @ts-expect-error
    description: 'Show the version number',
    required: '×',
    default: false,
  },
  help: {
    type: 'boolean',
    short: 'h',
    // @ts-expect-error
    description: 'Show this help message',
    required: '×',
    default: false,
  },
  input: {
    type: 'string',
    short: 'i',
    // @ts-expect-error
    description: 'Input file path of swagger json',
    required: '√',
    default: '',
  },
  api: {
    type: 'string',
    short: 'a',
    // @ts-expect-error
    description: 'Generate typings match the API path',
    default: '*',
    required: '×',
  },
  method: {
    type: 'string',
    short: 'm',
    // @ts-expect-error
    description: 'Generate code match the HTTP method',
    default: '*',
    required: '×',
  },

  debug: {
    type: 'boolean',
    default: false,
    // @ts-expect-error
    description: 'Print debug info',
    required: '×',
    short: 'd',
  },

  verbose: {
    type: 'boolean',
    default: false,
    // @ts-expect-error
    description: 'Print debug info',
    required: '×',
  },

  'types-only': {
    type: 'boolean',
    default: false,
    // @ts-expect-error
    description: 'Generate only types',
    required: '×',
    short: 't',
  },

  'function-only': {
    type: 'boolean',
    default: false,
    // @ts-expect-error
    description: 'Generate only functions',
    required: '×',
    short: 'f',
  },

  'return-type': {
    type: 'boolean',
    short: 'r',
    default: true,
    // @ts-expect-error
    description: 'Explicitly specify return type of function',
    required: '×',
  },

  grouped: {
    short: 'g',
    type: 'boolean',
    default: true,
    // @ts-expect-error
    description: 'Print functions by group',
    required: '×',
  },

  'use-interface': {
    type: 'boolean',
    default: false,
    // @ts-expect-error
    description: 'Generate interface instead of type',
    required: '×',
  },
  request: {
    type: 'boolean',
    default: false,
    // @ts-expect-error
    description: 'Generate request function. `no-request` to disable',
    required: '×',
  },

  header: {
    type: 'string',
    short: 'H',
    // @ts-expect-error
    description: 'Add custom header content before the generated code',
    required: '×',
  },
}

export const parsed = parse(args)

/**
 *
 * @param {string[]} args
 * @returns {import('./typing').IParsedArgs}
 * @example
 * const args = [ '--input', './assets/openapi-3.0.1.json', '--api', 'evaluate' ]
 * parseArgs(args);
 *
 * { input: './assets/openapi-3.0.1.json', api: 'evaluate' }
 */
function parse(args) {
  const { values } = parseArgs({
    args,
    options,
    allowNegative: true,
  })

  values.debug = values.debug || values.verbose

  const logger = createLogger('ARGS', { debug: values.debug })

  logger.log('args:', args)
  logger.log('values:', values)

  return values
}

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function readPkgJSON() {
  const packageJsonPath = resolve(__dirname, '..', 'package.json')
  const pkg = await readJSONFile(packageJsonPath)

  return pkg
}

// @ts-expect-error
export async function printHelp(options) {
  const pkg = await readPkgJSON()
  const { name, version } = pkg

  console.log()
  console.log(' '.repeat(50), bold(`${name}@${version}`))
  console.log()

  console.log(bold(`## Usage`))
  console.log(green(`pnpx swaggered -i path/to/openapi.json -a foo [options]`))
  console.log()

  console.log(bold(`## Options`))
  console.table(options)
  console.log()
}

export async function printVersion() {
  const pkg = await readPkgJSON()

  const { name, version } = pkg

  console.log()
  console.log(bold(`${name}@${version}`))
  console.log()
}
