#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { swaggerToTS } from './index.mjs';
import { readJSONFile } from './lib/fs.mjs';

const options = {
  help: {
    type: 'boolean',
    short: 'h',
    description: 'Show this help message',
    required: '×',
    default: false,
  },
  input: {
    type: 'string',
    short: 'i',
    description: 'Input file path of swagger json',
    required: '√',
  },
  api: {
    type: 'string',
    short: 'a',
    description: 'Generate typings match the API path',
    default: '*',
    required: '×',
  },
  method: {
    type: 'string',
    short: 'm',
    description: 'Generate code match the HTTP method',
    default: '*',
    required: '×',
  },

  debug: {
    type: 'boolean',
    default: false,
    description: 'Print debug info',
    required: '×',
    short: 'd',
  },

  typesOnly: {
    type: 'boolean',
    default: false,
    description: 'Generate only types',
    required: '×',
    short: 't',
  },

  functionOnly: {
    type: 'boolean',
    default: false,
    description: 'Generate only functions',
    required: '×',
    short: 'f',
  },

  grouped: {
    short: 'g',
    type: 'boolean',
    default: false,
    description: 'Print functions by group',
    required: '×',
  },

  'use-interface': {
    type: 'boolean',
    default: false,
    description: 'Generate interface instead of type',
    required: '×',
  },
};

/**
 * @param {{ parsed: { help:boolean; 'use-interface': boolean } & Parameters<typeof swaggerToTS>[0]; options: any }} opts
 */
async function main({ parsed, options }) {
  if (parsed.help) {
    await printHelp(options);

    return;
  }

  const { help: _, 'use-interface': useInterface, ...opts } = parsed;

  opts.debug && console.time('swaggerToTS');
  // console.log('opts:', opts);

  await swaggerToTS({
    ...opts,
    useInterface,
  });

  opts.debug && console.timeEnd('swaggerToTS');
}

const args = process.argv.slice(2);

// @ts-expect-error
main(parse(args));

/**
 *
 * @param {string[]} args
 * @example
 * const args = [ '--input', './assets/openapi-3.0.1.json', '--api', 'evaluate' ]
 * parseArgs(args);
 *
 * { input: './assets/openapi-3.0.1.json', api: 'evaluate' }
 */
function parse(args) {
  // @ts-expect-error
  const { values } = parseArgs({ args, options });

  if (values.debug) {
    console.log('args:', args);
    console.log('values:', values);
  }

  return { parsed: values, options };
}

// @ts-expect-error
async function printHelp(options) {
  const pkg = await readJSONFile('./package.json');
  const { name, version } = pkg;

  console.log();
  console.log(name + '@' + version);
  console.log();
  console.table(options);
  console.log();

  process.exitCode = 0;
}
