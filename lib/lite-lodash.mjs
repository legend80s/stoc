/**
 *
 * @param {string} str
 * @returns {boolean}
 */
export function isVariableName(str) {
  return !!str && /^[a-z]/i.test(str);
}

/**
 *
 * @param {string} str
 * @param {number} count
 * @returns {string}
 */
export function prefixSpacesToEveryNewLine(str, count = 2) {
  return str.replace(/^(.)/gm, ' '.repeat(count) + '$1');
}
