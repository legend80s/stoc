import { compile } from 'json-schema-to-typescript';

const GENERIC_KEYS = ['data'];

/**
 * Implement `Object.groupBy`.
 * @template T
 * @param {T[]} array
 * @param {(item: T, index: number) => string | number} keyGenerator
 * @returns {Record<string, T[]>}
 */
export function groupBy(array, keyGenerator) {
  try {
    // @ts-expect-error Node.js 21.0.0+ has Object.groupBy
    return Object.groupBy(array, keyGenerator);
  } catch (error) {
    // fallback to custom implementation
    return array.reduce((result, item, index) => {
      const key = keyGenerator(item, index);

      if (!result[key]) {
        result[key] = [];
      }

      result[key].push(item);

      return result;
    }, Object.create(null));
  }
}

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

/**
 *
 * @param {any} schema
 * @returns
 * @example
 */
export async function genGenericRespType(schema) {
  // console.log('schema:', schema);
  // console.assert(!schema.title, 'schema.title must be empty', schema);

  let genericKey;

  for (const [key, value] of Object.entries(schema.properties)) {
    if (value.type === 'object') {
      genericKey = key;
      break;
    }
  }

  if (!genericKey) {
    genericKey = GENERIC_KEYS.find((key) =>
      schema.properties.hasOwnProperty(key)
    );

    // console.log(
    //   'No `object` type found in `schema.properties`.',
    //   `fallback to key \`${genericKey}\``,
    //   'from default keys',
    //   GENERIC_KEYS
    // );
  }

  if (!genericKey) {
    // console.error('schema.properties:', schema.properties);
    console.warn(
      '[swaggered] No `object` type found in `schema.properties` and no property key find from default keys',
      GENERIC_KEYS,
      '. Generic response type will not be generated'
    );

    return '';

    // throw new Error(
    //   'No `object` type found in `schema.properties`. The response schema should be the form of `{ foo: { type: "integer", ...  }, bar: { type: "object", ... }, baz: { type: "string", ...} }`. Notice the `bar` is an `object` type.'
    // );
  }

  // console.log('genericKey:', genericKey);
  schema.title = '__GenericResp';

  let type = await compile(schema, '', {
    bannerComment: '',
    additionalProperties: false,
  });

  // interface IBaseResponsePagedQueryBarsResponse {
  //   code: number;
  //   message?: string | null;
  //   data?: IPagedQueryBarsRespData | null;
  // }
  type = type.replace(
    new RegExp(genericKey + '(\\?)?:\\s.+;'),
    genericKey + '$1: T;'
  );
  type = type.replace('export interface __GenericResp', 'interface Data<T>');
  type = type.split('export interface')[0].trim();

  // console.log('type after:', type);

  // schema.title = undefined;

  return type;
}
