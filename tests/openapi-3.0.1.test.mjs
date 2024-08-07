import { deepStrictEqual } from 'node:assert';
import { it } from 'node:test';

import { generateTSFromFile } from '../index.mjs';

const fp = '../assets/openapi-3.0.1.json';

it('with openapi 3.0.1', async () => {
  // const input = `node ./cli.mjs swagger -i ./assets/openapi-apiserver.json --api api_keys --method get`;
  // const actual = execSync(input).toString();
  const actual = await generateTSFromFile(fp, {
    filter: {
      api: 'baz',
    },
  });
  deepStrictEqual(actual.total, 1);
  deepStrictEqual(actual.list.length, 1);

  /** @type {typeof actual.list} */
  const expected = [
    {
      code:
        '/**\n' +
        ' * 分页查询foo作业\n' +
        ' */\n' +
        `export async function listFoo(params: IListFooParams) {\n` +
        "  return request<Data<IListFooRespData>>('/api/bar/v1/baz/foo/list', {\n" +
        "    method: 'GET',\n" +
        '    params,\n' +
        '  });\n' +
        '}',
      method: 'GET',
      path: '/api/bar/v1/baz/foo/list',
      requestBodyType: '',
      requestParametersType:
        'interface IListFooParams {\n' +
        '  req: {\n' +
        '    /**\n' +
        '     * current\n' +
        '     */\n' +
        '    current: number;\n' +
        '    /**\n' +
        '     * pageSize\n' +
        '     */\n' +
        '    pageSize: number;\n' +
        '  };\n' +
        '}',
      responseType:
        'interface IListFooRespData {\n' +
        '  total?: number;\n' +
        '  pageSize?: number;\n' +
        '  current?: number;\n' +
        '  list?: {\n' +
        '    id?: number;\n' +
        '    name?: string;\n' +
        '    description?: string;\n' +
        '    status?: "XX" | "YY" | "COMPLETED" | "FAILED";\n' +
        '    bars?: string[];\n' +
        '  }[];\n' +
        '}',
      summary: 'listFoo',
      description: '分页查询foo作业',
    },
  ];

  // console.log('|' + actual.list[0].responseType + '|');

  deepStrictEqual(actual.list, expected);
});

// import { swaggerToTS } from '../index.mjs';

// async function main() {
//   console.time('swaggerToTS');

//   await swaggerToTS({
//     input: './assets/openapi-3.0.1.json',
//     api: 'baz',
//     // method: '*',
//   });

//   console.timeEnd('swaggerToTS');
// }

// await main();
