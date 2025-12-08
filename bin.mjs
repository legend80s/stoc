#!/usr/bin/env node

// oxlint-disable no-unused-expressions
// @ts-check
import { swaggerToTS } from './index.mjs'
import { options, parsed, printHelp, printVersion } from './lib/args.mjs'

/**
 * @param {typeof parsed} parsed
 * @param {typeof options} options
 */
async function main(parsed, options) {
  if (parsed.help) {
    await printHelp(options)

    return
  }

  if (parsed.version) {
    await printVersion()

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

    // @ts-expect-error Type 'string | undefined' is not assignable to type '"*" | "get" | "post" | "delete" | "head" | "put" | "patch" | undefined'.
    method: parsed.method,
  })

  opts.debug && console.timeEnd('swaggerToTS')
}

main(parsed, options)
