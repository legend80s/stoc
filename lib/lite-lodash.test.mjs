import assert from 'node:assert'
import { describe, it } from 'node:test'
import {
  addReturnTypeToFunction,
  interfaceToType,
  toServiceName,
} from './lite-lodash.mjs'

describe('interfaceToType', () => {
  it('should convert an one-line interface to a type', () => {
    const input =
      'interface IFoo { code: number; message: string | null; data?: IPagedQueryBarsRespData | null; }'
    const actual = interfaceToType(input)
    const expected =
      'type IFoo = { code: number; message: string | null; data?: IPagedQueryBarsRespData | null; }'

    assert.deepStrictEqual(actual, expected)
  })

  it('should convert an interface to a type', () => {
    const input = `interface IFoo {
  code: number;
  message: string | null;
  data?: IPagedQueryBarsRespData | null;
}`
    const actual = interfaceToType(input)
    const expected = `type IFoo = {
  code: number;
  message: string | null;
  data?: IPagedQueryBarsRespData | null;
}`

    assert.deepStrictEqual(actual, expected)
  })

  it('should convert multiple interfaces to types', () => {
    const input = `interface bar {
  name: string;
  age: number;
}

interface IFoo {
  code: number;
  message: string | null;
  data?: IPagedQueryBarsRespData | null;
}`
    const actual = interfaceToType(input)
    const expected = `type bar = {
  name: string;
  age: number;
}

type IFoo = {
  code: number;
  message: string | null;
  data?: IPagedQueryBarsRespData | null;
}`

    assert.deepStrictEqual(actual, expected)
  })

  it('should convert extends interface to & type', () => {
    const input = `
interface IBar { code: number; message: string | null; }
interface IFoo extends IBar { data?: IPagedQueryBarsRespData | null; }
`
    const actual = interfaceToType(input)
    const expected = `
type IBar = { code: number; message: string | null; }
type IFoo = IBar & { data?: IPagedQueryBarsRespData | null; }
`

    assert.deepStrictEqual(actual, expected)
  })
})

it('#addReturnTypeToFunction', () => {
  assert.equal(
    addReturnTypeToFunction('function foo() {}', 'string'),
    'function foo(): string {}'
  )
  assert.equal(
    addReturnTypeToFunction('function foo(param: string) {}', 'number'),
    'function foo(param: string): number {}'
  )
  assert.equal(
    addReturnTypeToFunction('function foo(param: () => string) {}', 'number'),
    'function foo(param: () => string): number {}'
  )
  assert.equal(
    addReturnTypeToFunction('function foo(str: "test()") {}', 'boolean'),
    'function foo(str: "test()"): boolean {}'
  )
  // 参数是字符串里面包含返回值，这种罕见情况不处理
  assert.equal(
    addReturnTypeToFunction(
      'function foo(str: "function test(): string") {}',
      'boolean'
    ),
    'function foo(str: "function test(): string") {}'
  )
  assert.equal(
    addReturnTypeToFunction('function foo(param: string): string {}', 'number'),
    'function foo(param: string): string {}'
  )
  assert.equal(
    addReturnTypeToFunction(
      'async function searchProducts(data: ISearchProductsReqData) {',
      'Promise<ISearchProductsRespData>'
    ),
    'async function searchProducts(data: ISearchProductsReqData): Promise<ISearchProductsRespData> {'
  )
})

it('#toServiceName', () => {
  //  'foo/evaluate' => 'Evaluation'
  assert.equal(toServiceName('foo/evaluate'), 'Evaluation')

  //'/api/foo/v1/bar/{bar_id}/baz/{baz_id}' => BazService
  assert.equal(toServiceName('/api/foo/v1/bar/{bar_id}/baz/{baz_id}'), 'Baz')

  //'/api/foo/v1/bar/{bar_id}/{baz_id}' => BarService
  assert.equal(toServiceName('/api/foo/v1/bar/{bar_id}/{baz_id}'), 'Bar')
})
