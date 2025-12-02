export const WHITE = '\x1b[37m'
export const RESET = '\x1b[0m'
export const RED = '\x1b[31m'
export const GREEN = '\x1b[32m'
export const YELLOW = '\x1b[33m'
// const UNDERLINE = '\x1b[4m'
const BOLD = '\x1b[1m'

/**
 * @param {`\x1b[${string}m`} color
 * @returns
 */
function colorize(color) {
  /** @param {string} str */
  return (str) => `${color}${str}${RESET}`
}

export const green = colorize(GREEN)
export const bold = colorize(BOLD)
