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

/**
 *
 * @param {string[]} strs
 * @returns {string}
 *
 * @example
 * const strs = ['/api/foo/v1/baz/bar/', '/api/foo/v1/baz/result/list', `/api/foo/v1/baz/bar/list`, '/api/foo/v1/baz/infer-data/{id}', '/api/foo/v1/baz/infer-data/list']
 *
 * findMaxPrefixSubstring(strs) // '/api/foo/v1/baz/'
 */
export function findMaxPrefixSubstring(strs) {
  let maxPrefix = '';
  const str0 = strs[0];
  const min = Math.min(...strs.map((str) => str.length));

  for (let i = 0; i < min; i++) {
    if (strs.every((str) => str[i] === str0[i])) {
      maxPrefix += str0[i];
    } else {
      break;
    }
  }

  return maxPrefix;
}

/**
 *
 * @param {string} verb
 * @returns {string}
 *
 * @example
 * verbToNoun('evaluate') // 'evaluation'
 */
export function verbToNoun(verb) {
  if (verb.endsWith('s')) {
    return verb.slice(0, -1);
  } else if (verb.endsWith('ed')) {
    return verb.slice(0, -2);
  } else if (verb.endsWith('ing')) {
    return verb.slice(0, -3);
  } else if (verb.endsWith('te')) {
    return verb.slice(0, -2) + 'tion';
  } else {
    return verb;
  }
}

/**
 * @param {string} path
 * @returns {string}
 * @example
 * replaceInlineIds('/api/foo/v1/bar/{id1}/baz/{id2}')
 * === '/api/foo/v1/bar/${params.id1}/baz/${params.id2}'
 */
export function replaceInlineIds(path) {
  return path.replace(/\{(\w+)\}/g, '${params.$1}');
}
