import { deepStrictEqual, match } from 'node:assert'
import { execSync } from 'node:child_process'
import { it } from 'node:test'
import { stripVTControlCharacters } from 'node:util'

it('Use `interface`: in body', () => {
  const input = `node bin.mjs -i assets/openapi-3.0.1.json --api fox/list --use-interface --no-request --no-grouped --no-return-type`
  const actual = stripVTControlCharacters(execSync(input).toString('utf8'))
  const expected = `/**
 * 分页查询foo作业3
 */
async function listFoo(data: IListFooReqData) {
  return request<Data<IListFooRespData>>('/api/account/v1/fox/list', {
    method: 'POST',
    data,
  });
}

interface Data<T> {
  code?: number;
  data?: T;
  errorMsg?: string;
  success?: boolean;
}

interface IListFooReqData {
  /**
   * current
   * 范围 **[1, +∞]**
   */
  current: number;
  /**
   * pageSize
   * 范围 **[-∞, 1000]**
   */
  pageSize: number;
}

interface IListFooRespData {
  total?: number;
  pageSize?: number;
  current?: number;
  list?: {
    id?: number;
    name?: string;
    description?: string;
    status?: "XX" | "YY" | "COMPLETED" | "FAILED";
    bars?: string[];
  }[];
}

`

  deepStrictEqual(actual, expected)
})

it('Use `interface`: should remove params in passed args because all the params has been consumed by the url (in path)', () => {
  const input = `node bin.mjs --input ./assets/openapi-apiserver-simple.json --api bar -m delete --use-interface --no-grouped --no-request --no-return-type`
  const actual = stripVTControlCharacters(execSync(input).toString('utf8'))
  const expected = `/**
 * Delete Bar
 */
async function deleteBar(params: IDeleteBarParamsInPath) {
  return request<Data<IDeleteBarRespData>>(\`/api/foo/v1/bar/\${params.bar_id}/baz/\${params.baz_id}\`, {
    method: 'DELETE'
  });
}

type DeleteBarRespData = string;

interface Data<T> {
  code: number;
  message?: string | null;
  data?: T;
}

interface IDeleteBarParamsInPath {
  bar_id: number;
  baz_id: number;
}

type IDeleteBarRespData = string;

`

  deepStrictEqual(actual, expected)
})

it('Use `type` by default: in body', () => {
  const input = `node bin.mjs -i assets/openapi-3.0.1.json --api fox/list --no-request --no-return-type --no-grouped`
  const actual = stripVTControlCharacters(execSync(input).toString('utf8'))
  const expected = `/**
 * 分页查询foo作业3
 */
async function listFoo(data: IListFooReqData) {
  return request<Data<IListFooRespData>>('/api/account/v1/fox/list', {
    method: 'POST',
    data,
  });
}

type Data<T> = {
  code?: number;
  data?: T;
  errorMsg?: string;
  success?: boolean;
}

type IListFooReqData = {
  /**
   * current
   * 范围 **[1, +∞]**
   */
  current: number;
  /**
   * pageSize
   * 范围 **[-∞, 1000]**
   */
  pageSize: number;
}

type IListFooRespData = {
  total?: number;
  pageSize?: number;
  current?: number;
  list?: {
    id?: number;
    name?: string;
    description?: string;
    status?: "XX" | "YY" | "COMPLETED" | "FAILED";
    bars?: string[];
  }[];
}

`

  deepStrictEqual(actual, expected)
})

it('Use `type` by default: should remove params in passed args because all the params has been consumed by the url (in path)', () => {
  const input = `node bin.mjs --input ./assets/openapi-apiserver-simple.json --api bar -m delete --no-request --no-return-type --no-grouped`
  const actual = stripVTControlCharacters(execSync(input).toString('utf8'))
  const expected = `/**
 * Delete Bar
 */
async function deleteBar(params: IDeleteBarParamsInPath) {
  return request<Data<IDeleteBarRespData>>(\`/api/foo/v1/bar/\${params.bar_id}/baz/\${params.baz_id}\`, {
    method: 'DELETE'
  });
}

type DeleteBarRespData = string;

type Data<T> = {
  code: number;
  message?: string | null;
  data?: T;
}

type IDeleteBarParamsInPath = {
  bar_id: number;
  baz_id: number;
}

type IDeleteBarRespData = string;

`

  deepStrictEqual(actual, expected)
})

it('Should show help message', () => {
  const input = `node bin.mjs --help`
  const actual = stripVTControlCharacters(execSync(input).toString('utf8'))

  match(actual, /swaggered@\d+\.\d+\.\d+/)

  // console.log('actual:', actual)
  const expected = `pnpx swaggered -i path/to/openapi.json -a foo [options]`

  deepStrictEqual(actual.includes('## Usage'), true)
  deepStrictEqual(actual.includes(expected), true)
  deepStrictEqual(actual.includes('## Options'), true)
  deepStrictEqual(actual.includes('help'), true)
  deepStrictEqual(actual.includes('types-only'), true)
  deepStrictEqual(actual.includes('request'), true)
})
