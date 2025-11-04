// @ts-check
import { parseArgs } from 'node:util'
import { readJSONFile } from './fs.mjs'

const args = process.argv.slice(2)

/** @satisfies {import('node:util').ParseArgsOptionsConfig} */
const options = {
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
    description: 'Explicitly specify the return type of the function',
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
    default: true,
    // @ts-expect-error
    description: 'Generate request.ts. `no-request` to disable',
    required: '×',
  },
}

export const parsed = parse(args)

/**
 *
 * @param {string[]} args
 * @returns {{ parsed: { help: boolean; input?: string | undefined; api: string; method: string; debug: boolean; 'types-only': boolean; 'function-only': boolean; grouped: boolean; 'use-interface': boolean; request: boolean; }; options: any }}
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

  if (values.debug) {
    console.log('args:', args)
    console.log('values:', values)
  }

  return { parsed: values, options }
}

// @ts-expect-error
export async function printHelp(options) {
  const pkg = await readJSONFile('./package.json')
  const { name, version } = pkg

  console.log()
  console.log(`${name}@${version}`)
  console.log()
  console.table(options)
  console.log()

  process.exitCode = 0
}
