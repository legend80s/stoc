#!/usr/bin/env node

import { parseArgs } from 'node:util';

import { swaggerToTS } from './index.mjs';

/**
 * @param {Parameters<typeof swaggerToTS>[0]} opts
 */
async function main(opts) {
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
    input: {
      type: 'string',
      short: 'i',
    },
    api: {
      type: 'string',
      short: 'a',
    },
    method: {
      type: 'string',
      short: 'm',
    },
    debug: {
      type: 'boolean',
      default: false,
    },
    typesOnly: {
      type: 'boolean',
      default: false,
    },

    /** print functions into group */
    grouped: {
      type: 'boolean',
      default: false,
    },
  };

  // @ts-expect-error
  const { values } = parseArgs({ args, options });

  // console.log('args:', args);
  // console.log('values:', values);

  return values;
}
