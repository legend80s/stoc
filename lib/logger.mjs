// @ts-check
// oxlint-disable no-unused-expressions
import { parsed } from './args.mjs'
import { GREEN, RED, RESET, WHITE, YELLOW } from './colors.mjs'

/** @import { CallableKeys } from './typing.js' */

/**
 *
 * @param {CallableKeys<typeof console>} level
 * @returns
 */
function genLogMethod(
  level,
  { debug = false, namespace = '', showTime = true } = {}
) {
  /**
   * @param  {any[]} args
   * @returns {void}
   */
  return (...args) => {
    if (!debug) {
      return
    }

    const LEVEL = level.toUpperCase()
    const now = new Date().toLocaleString()
    /** @type {Partial<Record<CallableKeys<typeof console>, string>>} */
    const colors = {
      debug: WHITE,
      log: GREEN,
      info: GREEN,
      warn: YELLOW,
      error: RED,
    }

    /** @type {string} */
    const color = colors[level] || WHITE

    if (namespace) {
      return console[level](
        `${color}[${namespace}][${LEVEL}]${showTime ? ` ${now}` : ''}${RESET}`,
        ...args
      )
    }

    if (showTime) {
      return console[level](`${color}[${LEVEL}]`, now + RESET, ...args)
    }

    console[level](`${color}[${LEVEL}]${RESET}`, ...args)
  }
}

/**
 * @param {string} namespace
 * @param {{ showTime?: boolean, debug?: boolean }} options
 */
export function createLogger(
  namespace,
  { debug = false, showTime = true } = {}
) {
  /** @satisfies {CallableKeys<console>[]} */
  const methods = /** @type {const} */ (['log', 'warn', 'error'])

  /** @type {Record<methods[number], ReturnType<typeof genLogMethod>>} */
  // @ts-expect-error
  const logger = {}

  methods.forEach((method) => {
    logger[method] = genLogMethod(method, { debug, namespace, showTime })
  })

  return logger
}

export const logger = createLogger('', { debug: parsed.debug })
