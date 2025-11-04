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
