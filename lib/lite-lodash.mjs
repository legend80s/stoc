import { compile } from 'json-schema-to-typescript'
import { logger } from './logger.mjs'

const GENERIC_KEYS = /** @type {const} */ (['data'])

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
    return Object.groupBy(array, keyGenerator)
  } catch {
    // fallback to custom implementation
    return array.reduce((result, item, index) => {
      const key = keyGenerator(item, index)

      if (!result[key]) {
        result[key] = []
      }

      result[key].push(item)

      return result
    }, Object.create(null))
  }
}

/**
 *
 * @param {string} str
 * @returns {boolean}
 */
export function isVariableName(str) {
  return !!str && /^[a-z][a-z\s]+[a-z]$/i.test(str)
  // return !!str && /^[a-z]+$/i.test(str)
}

/**
 *
 * @param {string} str
 * @param {number} count
 * @returns {string}
 */
export function prefixSpacesToEveryNewLine(str, count = 2) {
  return str.replace(/^(.)/gm, ' '.repeat(count) + '$1')
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
  let maxPrefix = ''
  const str0 = strs[0]
  const min = Math.min(...strs.map((str) => str.length))

  for (let i = 0; i < min; i++) {
    if (strs.every((str) => str[i] === str0[i])) {
      maxPrefix += str0[i]
    } else {
      break
    }
  }

  return maxPrefix
}

/**
 *
 * @param {string} verb
 * @returns {string}
 *
 * @example
 * verbToNoun('evaluate') // 'evaluation'
 */
function verbToNoun(verb) {
  if (verb.endsWith('s')) {
    return verb.slice(0, -1)
  } else if (verb.endsWith('ed')) {
    return verb.slice(0, -2)
  } else if (verb.endsWith('ing')) {
    return verb.slice(0, -3)
  } else if (verb.endsWith('te')) {
    return verb.slice(0, -2) + 'tion'
  } else {
    return verb
  }
}

/**
 * @param {string} longestPrefix
 * @returns {string}
 */
export function toServiceName(longestPrefix) {
  const paths = longestPrefix.split('/').filter((path) => !path.includes('{'))
  const path = paths.at(-1)

  // console.assert(path, 'findMaxPrefixSubstring is empty', paths);
  if (!path) {
    return ''
  }

  return verbToNoun(path[0].toUpperCase() + path.slice(1))
}

/**
 * @param {string} path
 * @returns {string}
 * @example
 * replaceInlineIds('/api/foo/v1/bar/{id1}/baz/{id2}')
 * === '/api/foo/v1/bar/${params.id1}/baz/${params.id2}'
 */
export function replaceInlineIds(path) {
  return path.replace(/\{(\w+)\}/g, '${params.$1}')
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

  let genericKey

  for (const [key, value] of Object.entries(schema.properties)) {
    // console.log('key:', key, 'value.type', value.type)
    if (
      // @ts-expect-error
      GENERIC_KEYS.includes(key) &&
      value.type === 'object' &&
      value.properties
    ) {
      genericKey = key
      break
    }
  }
  // console.log('genericKey:', genericKey)

  if (!genericKey) {
    genericKey = GENERIC_KEYS.find((key) =>
      schema.properties.hasOwnProperty(key)
    )

    // console.log(
    //   'No `object` type found in `schema.properties`.',
    //   `fallback to key \`${genericKey}\``,
    //   'from default keys',
    //   GENERIC_KEYS
    // );
  }

  if (!genericKey) {
    // console.error('schema.properties:', schema.properties);
    logger.warn(
      '[swaggered] No `object` type found in `schema.properties` and no property key find from default keys',
      GENERIC_KEYS,
      '. Generic response type will not be generated'
    )

    return ''

    // throw new Error(
    //   'No `object` type found in `schema.properties`. The response schema should be the form of `{ foo: { type: "integer", ...  }, bar: { type: "object", ... }, baz: { type: "string", ...} }`. Notice the `bar` is an `object` type.'
    // );
  }

  // console.log('genericKey:', genericKey);
  schema.title = '__GenericResp'

  let type = await compile(schema, '', {
    bannerComment: '',
    additionalProperties: false,
  })

  // interface IBaseResponsePagedQueryBarsResponse {
  //   code: number;
  //   message?: string | null;
  //   data?: IPagedQueryBarsRespData | null;
  // }
  type = type.replace(
    new RegExp(genericKey + '(\\?)?:\\s.+;'),
    genericKey + '$1: T;'
  )
  type = type.replace('export interface __GenericResp', 'interface Data<T>')
  type = type.split('export interface')[0].trim()

  // console.log('type after:', type);

  // schema.title = undefined;

  return type
}

/**
 *
 * @param {string} str
 * @example
 * interfaceToType('interface IFoo { code: number; message: string | null }')
 * => 'type IFoo = { code: number; message: string | null }'
 */
export function interfaceToType(str) {
  const step1 = str.replace(/interface ([\S]+) {/g, 'type $1 = {')

  // step2: convert `interface IFoo extends IBar {` to `type IFoo = IBar & {`
  const step2 = step1.replace(
    /interface ([\S]+) extends ([\S]+) {/g,
    'type $1 = $2 & {'
  )

  return step2
}

/**
 * export only for unit test
 * @param {string} code
 * @param {string} returnType
 * @returns {string}
 *
 * @example
 * addReturnTypeToFunction('function foo() {}', 'string') // => 'function foo(): string {}'
 * addReturnTypeToFunction('function foo(param: string) {}', 'number') // => 'function foo(param: string): number {}'
 * addReturnTypeToFunction('function foo(param: () => string) {}', 'number') // => 'function foo(param: () => string): number {}'
 * console.log(addReturnTypeToFunction('function foo(str: "test()") {}', 'boolean')); // => 'function foo(str: "test()"): boolean {}'
 * console.log(addReturnTypeToFunction('function foo(str: "function test(): string") {}', 'boolean')); // => 'function foo(str: "function test(): string"): boolean {}'
 *
 * // should not replace return type if already exists
 * addReturnTypeToFunction('function foo(param: string): string {}', 'number') // => 'function foo(param: string): string {}'
 * // add Promise return type
 * addReturnTypeToFunction('async function searchProducts(data: ISearchProductsReqData)', 'Promise<ISearchProductsRespData>') // => 'async function searchProducts(data: ISearchProductsReqData): Promise<ISearchProductsRespData> {}'
 */
export function addReturnTypeToFunction(code, returnType) {
  // 如果已经存在返回类型（): 后面不是 =>），则直接返回
  // 后面是 => 说明是函数参数的返回类型，应该要加上返回类型
  if (/(\):\s*[^=>])/.test(code)) {
    return code
  }

  // 在最后一个右括号后添加返回类型
  return code.replace(/\)(\s*\{)/, `): ${returnType}$1`)
}
