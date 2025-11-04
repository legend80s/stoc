#!/usr/bin/env node

// oxlint-disable no-unused-expressions
// @ts-check
import { swaggerToTS } from './index.mjs'
import { parsed, printHelp } from './lib/args.mjs'

/**
 * @param {{ parsed: { help: boolean; request?: boolean; 'use-interface': boolean, 'types-only': boolean, 'function-only': boolean; 'return-type': boolean } & Parameters<typeof swaggerToTS>[0]; options: any }} opts
 */
async function main({ parsed, options }) {
  if (parsed.help) {
    await printHelp(options)

    return
  }

  const {
    help: _,
    'use-interface': useInterface,
    'types-only': typesOnly,
    'function-only': functionOnly,
    'return-type': returnType,
    ...opts
  } = parsed

  opts.debug && console.time('swaggerToTS')
  // console.log('opts:', opts);

  await swaggerToTS({
    ...opts,
    useInterface,
    typesOnly,
    functionOnly,
    returnType,
  })

  opts.debug && console.timeEnd('swaggerToTS')
}

main(
  // @ts-expect-error
  parsed
)
