export type IOpenAPISchema =
  typeof import('../assets/openapi-apiserver-simple.json')

export interface IFilter {
  api?: string
  method?: 'get' | 'post' | 'delete' | 'head' | 'put' | 'patch' | '*'
}

export interface IOptions {
  /** file path to swagger json */
  input: string
  /** only generate typings match the api path, default * */
  api?: IFilter['api']
  /** only generate typings match the method, default * */
  method?: IFilter['method']
  /** debug mode */
  debug?: boolean
  /** only output types */
  typesOnly?: boolean
  /** only output functions */
  functionOnly?: boolean
  /** Annotate functions with explicit return type */
  returnType?: boolean
  /** should `prettyPrint` function in group by API (Longest Common Prefix algorithm), default `true` */
  grouped?: boolean
  /** Output `interface` instead of `type`, default `false` */
  useInterface?: boolean
  /** Should generate request function, default `true` */
  request?: boolean
}

export interface IGenerateOptions {
  /** prefix `export` to all `interface`s. default `false` */
  interfaceWithExport?: boolean
  /** prefix `export` to all `function`s. default `true` */
  functionWithExport?: boolean
  explicitReturnTypeAttached?: IOptions['returnType']

  /** prefix to all `interface`s. default `""` */
  interfacePrefix?: string
  /** generate types only. default `false` */
  typesOnly?: IOptions['typesOnly']
  /** default `false` */
  debug?: IOptions['debug']
  /** API filter conditions */
  filter?: IFilter

  /** should generate request.ts, default `true` */
  request?: IOptions['request']
}

/**
 * Extract the keys of an object type where their corresponding values are callable.
 *
 * @example
 * const foo = { a: () => {}, b: 123, c: function() {} }
 * // foo should be of type 'a' | 'c'
 */
export type CallableKeys<T> = {
  // biome-ignore lint/suspicious/noExplicitAny: any is needed here
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never
}[keyof T]

type c1 = CallableKeys<{
  a: () => void
  b: number
  c: string
  d: (x: number) => number
  e: (x: number, y: string) => () => number
}>

// c1 should be 'a' | 'd' | 'e'
