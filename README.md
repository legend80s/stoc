# Swaggered

> 从 Swagger JSON Schema 生成 JavaScript 客户端请求代码并带有严格的 TS 类型。
>
> Generate client JS request code with TypeScript definitions from Swagger OpenAPI Schema.

## Get Started

### 1. Use CLI `RECOMMENDED`

Generate request code with `api` contains `foo` only:

```bash
npx swaggered --input ./assets/openapi-3.0.1.json --api foo
```

<details>
  <summary>All flags:</summary>

```bash
npx swaggered \
  --input ./assets/openapi-3.0.1.json \
  --api evaluate \
  --method get \
  --debug=false \
  --typesOnly=false
```

- only `input` is required.
</details>

### 2. Use programmatically. `prettyPrint` automatically

```ts
async function main() {
  await swaggerToTS({
    input: swaggerJsonFilepath,
    api: 'baz',
    // method: '*',
  });
}

console.time('swaggerToTS');
await main();
console.timeEnd('swaggerToTS');
```

### 3. Use Programmatically. `prettyPrint` result or do whatever you want

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
