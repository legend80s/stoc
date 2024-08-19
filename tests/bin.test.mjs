import { it, beforeEach } from 'node:test';
import { deepStrictEqual } from 'node:assert';
import { execSync } from 'node:child_process';

beforeEach(() => {
  process.env.FORCE_COLOR = '0';
});

it('in body', () => {
  const input = `node bin.mjs -i assets/openapi-3.0.1.json --api fox/list`;
  const actual = execSync(input).toString('utf8');
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
   */
  current: number;
  /**
   * pageSize
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

`;

  deepStrictEqual(actual, expected);
});

it('should remove params in passed args because all the params has been consumed by the url (in path)', () => {
  const input = `node bin.mjs --input ./assets/openapi-apiserver-simple.json --api bar -m delete`;
  const actual = execSync(input).toString('utf8');
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

`;

  deepStrictEqual(actual, expected);
});
