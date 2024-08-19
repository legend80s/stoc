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
 * 分页查询foo作业
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
