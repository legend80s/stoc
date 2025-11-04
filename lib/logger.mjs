// @ts-check
// oxlint-disable no-unused-expressions
import { parsed } from './args.mjs'

/** @import { CallableKeys } from './typing.js' */

/**
 *
 * @param {CallableKeys<console>} level
 * @returns
 */
function genLogMethod(level, { namespace = '', showTime = true } = {}) {
  /**
   * @param  {any[]} args
   * @returns {void}
   */
  return (...args) => {
    if (!parsed.parsed.debug) {
      return
    }

    if (namespace) {
      return console[level](
        `[${namespace}]${showTime ? ` ${new Date().toISOString()}` : ''}`,
        ...args
      )
    }

    if (showTime) {
      return console[level](new Date().toISOString(), ...args)
    }

    // @ts-expect-error
    console[level](...args)
  }
}

/**
 * @param {string} namespace
 * @param {{ showTime?: boolean }} param1
 */
export function createLogger(namespace, { showTime = true } = {}) {
  /** @satisfies {CallableKeys<console>[]} */
  const methods = /** @type {const} */ (['log', 'warn', 'error'])

  /** @type {Record<methods[number], ReturnType<typeof genLogMethod>>} */
  // @ts-expect-error
  const logger = {}

  methods.forEach((method) => {
    logger[method] = genLogMethod(method, { namespace, showTime })
  })

  return logger
}

export const logger = createLogger('')
