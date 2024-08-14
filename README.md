# Swaggered

<p>
  <a href="https://www.npmjs.com/package/swaggered" target="_blank">
    <img src="https://img.shields.io/npm/v/swaggered.svg" alt="npm version" />
  </a>

  <a href="https://www.npmjs.com/package/swaggered">
    <img src="https://img.shields.io/npm/dm/swaggered.svg" alt="npm downloads" />
  </a>

  <a href="https://www.npmjs.com/package/git-commit-msg-linter" target="_blank">
    <img alt="lint by git commit msg linter" src="https://img.shields.io/badge/git-commit%20msg%20linter-blue" />
  </a>
</p>

> 从 Swagger JSON Schema 生成 TypeScript **客户端请求**代码并带有**严格的 TS 类型**和**丰富的注释**。
>
> Generate client **request code** with **TypeScript typings** and as many **comments** as possible from Swagger OpenAPI Schema.

## Features

- [x] **Strict TS Types**: Generate client code with `strict TS types` and keep the original `comments` in `tsdoc`
- [x] **Filterable**: You can generate only what you need using `filter` by `api` path and HTTP `method`
- [x] **Flexible Usage**: Can be used through CLI or programmatically
- [ ] **Flexible Format**:
  - [x] You can generate standalone request functions or by group
  - [ ] You can generate request code with customized template
- [x] **Pretty Print**: Highlight output with `shikijs`
- [x] **Battlefield tested**: Support all Swagger OpenAPI versions
- [x] **Unit tested**

## Get Started

### 1. Use CLI `RECOMMENDED`

Generate request code with `api` contains `foo` only:

Output to stdout

```bash
npx swaggered --input ./assets/openapi.json --api foo
```

Copy to clipboard

```bash
# macOS
npx swaggered --input ./assets/openapi.json --api foo | pbcopy

# Windows
npx swaggered --input ./assets/openapi.json --api foo | clip
```

Save to file

```bash
npx swaggered --input ./assets/openapi.json --api foo > ./src/service/foo.ts
```

<details>
  <summary>All flags:</summary>

- *only `input` is required.*
- `grouped` is my favorite flag, it will generate request functions by group. Give it a try!

```bash
┌──────────────┬───────────┬───────┬───────────────────────────────────────┬──────────┬─────────┐
│ (index)      │ type      │ short │ description                           │ required │ default │
├──────────────┼───────────┼───────┼───────────────────────────────────────┼──────────┼─────────┤
│ help         │ 'boolean' │ 'h'   │ 'Show this help message'              │ '×'      │ false   │
│ input        │ 'string'  │ 'i'   │ 'Input file path of swagger json'     │ '√'      │         │
│ api          │ 'string'  │ 'a'   │ 'Generate typings match the API path' │ '×'      │ '*'     │
│ method       │ 'string'  │ 'm'   │ 'Generate code match the HTTP method' │ '×'      │ '*'     │
│ debug        │ 'boolean' │ 'd'   │ 'Print debug info'                    │ '×'      │ false   │
│ typesOnly    │ 'boolean' │ 't'   │ 'Generate only types'                 │ '×'      │ false   │
│ functionOnly │ 'boolean' │ 'f'   │ 'Generate only functions'             │ '×'      │ false   │
│ grouped      │ 'boolean' │ 'g'   │ 'Print functions by group'            │ '×'      │ false   │
└──────────────┴───────────┴───────┴───────────────────────────────────────┴──────────┴─────────┘
```

</details>

### 2. Use programmatically. `generateTSFromSchema`

<details>
  <summary>A working and beautiful demo but a little bit long</summary>

```ts
import { prettyPrint, generateTSFromSchema } from './index.mjs';

const result = await generateTSFromSchema({
  openapi: '3.0.1',
  info: {
    title: 'OpenAPI definition',
    version: 'v0',
  },
  servers: [
    {
      url: 'http://127.0.0.1:8000',
      description: 'Generated server url',
    },
  ],
  paths: {
    '/api/bar/v1/baz/foo/list': {
      get: {
        tags: ['foo的相关接口'],
        summary: '分页查询foo作业',
        description: '分页查询foo作业',
        operationId: 'listFoo',
        parameters: [
          {
            name: 'req',
            in: 'query',
            required: true,
            schema: {
              $ref: '#/components/schemas/PageRequest',
            },
          },
        ],
        responses: {
          200: {
            description: '服务Okay，但请求是否成功请看返回体里面的code',
            content: {
              '*/*': {
                schema: {
                  $ref: '#/components/schemas/ResponsePageVOEvaluateFooResp',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      PageRequest: {
        required: ['current', 'pageSize'],
        type: 'object',
        properties: {
          current: {
            minimum: 1,
            type: 'integer',
            description: 'current',
            format: 'int32',
          },
          pageSize: {
            maximum: 1000,
            type: 'integer',
            description: 'pageSize',
            format: 'int32',
          },
        },
      },
      EvaluateFooResp: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
          },
          name: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          status: {
            type: 'string',
            enum: ['XX', 'YY', 'COMPLETED', 'FAILED'],
          },
          bars: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
      },
      PageVOEvaluateFooResp: {
        type: 'object',
        properties: {
          total: {
            type: 'integer',
            format: 'int64',
          },
          pageSize: {
            type: 'integer',
            format: 'int32',
          },
          current: {
            type: 'integer',
            format: 'int32',
          },
          list: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/EvaluateFooResp',
            },
          },
        },
      },
      ResponsePageVOEvaluateFooResp: {
        type: 'object',
        properties: {
          code: {
            type: 'integer',
            format: 'int32',
          },
          data: {
            $ref: '#/components/schemas/PageVOEvaluateFooResp',
          },
          errorMsg: {
            type: 'string',
          },
          success: {
            type: 'boolean',
          },
        },
      },
    },
  },
});

await prettyPrint(result);
```

</details>

### 3. Use programmatically. Generate from file and `prettyPrint` automatically

```ts
await swaggerToTS({
  input: swaggerJsonFilepath,
  api: 'baz',
  // method: '*',
});
```

### 4. Use Programmatically. Generate from file and `prettyPrint` result or do whatever you want

```typescript
const result = await generateTSFromFile(filepath, {
  typesOnly: false,
  filter: {
    api,
    method,
  },
});

prettyPrint(result, { debug, typesOnly });
```

<details>
  <summary>`result` type:</summary>

```typescript
interface IResult {
  list: IGeneratedItem[];
  total: number;
}

interface IGeneratedItem
 /** API path */
 path: string;

 /** HTTP method */
 method: string;

 /** HTTP request parameters type */
 requestParametersType: string;

 /** HTTP request body type */
 requestBodyType: string;

 /** HTTP response type */
 responseType: string;
```

</details>

<details>
  <summary>`prettyPrint` output:</summary>

```typescript
export async function list(params: PagedQueryBarsParams) {
  return request<Data<PagedQueryBarsRespData>>('/api/foo/v1/bars', {
    method: 'GET',
    params,
  });
}

type Data<T> = {
  code: number;
  data: T;
  message: string;
};

interface PagedQueryBarsParams {
  /**
   * 页码，必填，必须大于0
   */
  page_number: number;
  /**
   * 每页数量，必填，必须大于等于1且小于21
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
}

interface BaseResponsePagedQueryBarsResponse {
  code: number;
  message?: string | null;
  data?: PagedQueryBarsRespData | null;
}
interface PagedQueryBarsRespData {
  /**
   * bars总数
   */
  total: number;
  bars: GetBarRespData[];
}
interface GetBarRespData {
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
}
```

</details>

## API

### generateTSFromFile

Generate TypeScript definitions and client JS request code from a given Swagger OpenAPI JSON file.

### generateTSFromSchema

Generate from Swagger OpenAPI JSON Schema.
