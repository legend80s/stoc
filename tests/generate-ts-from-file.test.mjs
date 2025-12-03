import { deepStrictEqual } from 'node:assert'
import { it } from 'node:test'
import { generateTSFromFile } from '../lib/generate.mjs'

it('with filter', async () => {
  // const input = `node ./bin.mjs -i ./assets/openapi-apiserver.json --api api_keys --method get`;
  // const actual = execSync(input).toString();
  const actual = await generateTSFromFile(
    './assets/openapi-apiserver-simple.json',
    {
      filter: {
        api: 'bars',
        method: 'get',
      },
    }
  )
  deepStrictEqual(actual.total, 1)
  deepStrictEqual(actual.list.length, 1)

  // console.log('actual.list:', actual.list);

  /** @type {typeof actual.list} */
  const expected = [
    {
      summary: 'Paged Query Bars',
      description: 'Paged Query Bars',
      genericResp:
        'interface Data<T> {\n' +
        '  code: number;\n' +
        '  message?: string | null;\n' +
        '  data?: T;\n' +
        '}',
      group: '',
      method: 'GET',
      path: '/api/foo/v1/bars',

      code:
        '/**\n' +
        ' * Paged Query Bars\n' +
        ' */\n' +
        `
export async function pagedQueryBars(params: IPagedQueryBarsParams): Promise<Data<IPagedQueryBarsRespData>> {
  return request<Data<IPagedQueryBarsRespData>>('/api/foo/v1/bars', {
    method: 'GET',
    params,
  });
}`.trimStart(),

      requestParametersType: `
interface IPagedQueryBarsParams {
  /**
   * 页码，必填，必须大于0
   * 范围 **[1, +∞]**
   */
  page_number: number;
  /**
   * 每页数量，必填，必须大于等于1且小于21
   * 范围 **[1, 20]**
   */
  page_size: number;
  /**
   * bar name，模糊匹配，可空
   */
  bar_name?: string | null;
  /**
   * bar状态，0：未激活，1：激活，2：已过期，3：已删除，可为空，也可以包含一个或多个
   */
  status_list?: ("0" | "1" | "2" | "3")[] | null;
  /**
   * bar开始时间，可为空
   */
  start_time?: string | null;
  /**
   * bar结束时间，可为空
   */
  end_time?: string | null;
}`.trimStart(),
      requestBodyType: '',

      responseType: `interface IPagedQueryBarsRespData {
  /**
   * Bars总数
   */
  total: number;
  bars: IGetBarResponse[];
}
interface IGetBarResponse {
  /**
   * bar id，必定存在
   */
  bar_id: number;
  /**
   * bar name，必定存在
   */
  bar_name: string;
  /**
   * bar的创建时间，必定存在
   */
  created_time: string;
  /**
   * bar的上次更新时间，必定存在
   */
  updated_time: string;
}`.trimStart(),
    },
  ]

  // console.log('|' + actual.list[0].responseType + '|');

  deepStrictEqual(actual.list, expected)
})

it('with both data and params', async () => {
  // const input = `node cli.mjs  swagger -i ./assets/openapi-apiserver.json  --api completions$ -m post`;
  const actual = await generateTSFromFile(
    './assets/openapi-apiserver-simple.json',
    {
      interfacePrefix: '',
      filter: {
        api: 'completions$',
        method: 'post',
      },
    }
  )
  // console.log('actual:', JSON.stringify(actual))

  deepStrictEqual(actual.total, 2)
  deepStrictEqual(actual.list.length, 2)

  // console.log('input:', input, 'end');
  // console.log('actual:', actual, 'end');
  const genericResp =
    'interface Data<T> {\n' +
    '  code: number;\n' +
    '  message?: string | null;\n' +
    '  data?: T;\n' +
    '}'
  /** @type {typeof actual.list[0]} */
  const item1 = {
    description: 'Create Example',
    genericResp,
    group: '',
    summary: 'Create Example',
    path: '/api/foo/v1/baz/completions',
    method: 'POST',
    requestParametersType: ``,
    //     requestHeaderType: `
    // interface CreateExampleParams {
    //   "api-key"?: string;
    // }`.trimStart(),
    requestBodyType: `
interface BazCompletionRequest {
  model: string;
  messages: BazMessage[];
  temperature?: number | null;
}
interface BazMessage {
  content: string | null;
}`.trimStart(),
    responseType: '',
    code:
      '/**\n' +
      ' * Create Example\n' +
      ' */\n' +
      `export async function createExample(data: BazCompletionRequest) {
  return request('/api/foo/v1/baz/completions', {
    method: 'POST',
    data,
  });
}`.trimStart(),
  }
  const item2 = {
    description: 'Create Example For Internal',
    genericResp,
    group: '',
    summary: 'Create Example For Internal',
    path: '/api/foo/v1/controlled/baz/completions',
    method: 'POST',
    requestParametersType: ``,
    requestBodyType: `
interface BazCompletionRequest {
  model: string;
  messages: BazMessage[];
  temperature?: number | null;
}
interface BazMessage {
  content: string | null;
}`.trimStart(),
    responseType: '',
    code:
      '/**\n' +
      ' * Create Example For Internal\n' +
      ' */\n' +
      `
export async function createExampleForInternal(data: BazCompletionRequest) {
  return request('/api/foo/v1/controlled/baz/completions', {
    method: 'POST',
    data,
  });
}`.trimStart(),
  }

  // console.log('actual.list:', JSON.stringify(actual.list))
  deepStrictEqual(actual.list, [item1, item2])
})
