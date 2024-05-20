# Stoc - `s`wagger-openapi-json-`to`-`c`lient-code

## Example

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

Output:

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

## API

### generateTSFromFile

Generates TypeScript definitions and request code from a given Swagger/OpenAPI JSON file.

### generateTSFromSchema

Generates TypeScript definitions and request code from a given Swagger/OpenAPI JSON Schema.
