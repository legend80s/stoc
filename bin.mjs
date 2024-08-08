#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { swaggerToTS } from './index.mjs';

/**
 * @param {{values: { help:boolean } & Parameters<typeof swaggerToTS>[0]; options: any}} opts
 */
async function main({ values, options }) {
  if (values.help) {
    await printHelp(options);

    return;
  }

  const { help, ...opts } = options;

  opts.debug && console.time('swaggerToTS');
  // console.log('opts:', opts);

  await swaggerToTS(opts);

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
      description: 'Generate typings match the API path, default `*`',
      default: '*',
      required: '×',
    },
    method: {
      type: 'string',
      short: 'm',
      description: 'Generate code match the HTTP method, default `*`',
      default: '*',
      required: '×',
    },

    debug: {
      type: 'boolean',
      default: false,
      description: 'Print debug info',
      required: '×',
    },

    typesOnly: {
      type: 'boolean',
      default: false,
      description: 'Generate only types',
      required: '×',
    },

    grouped: {
      type: 'boolean',
      default: false,
      description: 'Print functions by group',
      required: '×',
    },
  };

  // @ts-expect-error
  const { values } = parseArgs({ args, options });

  // console.log('args:', args);
  // console.log('values:', values);

  return { values, options };
}

// @ts-expect-error
async function printHelp(options) {
  const pkg = await import('./package.json', {
    with: { type: 'json' },
  });
  const { name, version } = pkg.default;

  console.log();
  console.log(name + '@' + version);
  console.log();
  console.table(options);
  console.log();

  process.exitCode = 0;
}
