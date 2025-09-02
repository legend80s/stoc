// --- request.ts begins ---
// copy request.ts a new file such as utils/request.ts
import { message } from 'antd'

type IStringified = string | number | boolean
type IFlatObject = Record<string, IStringified | IStringified[]>

type IOptions = Omit<RequestInit, 'body'> & {
  data?: IFlatObject
  params?: IFlatObject
}

export type Data<T> = {
  code?: number
  data?: T
  message?: string
  success?: boolean
  total?: number
}

/**
 * 使用 fetch 实现 request 具备 TS 类型
 */
export async function request<Resp extends Data<unknown>>(
  url: string,
  options: IOptions
): Promise<Partial<Resp>> {
  const { data, params, ...rest } = options

  const requestInit: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // 请求带上 cookie
    ...rest,
  }

  // add params to url if params exist
  if (params) {
    url = addParamsToUrl(url, params)
  }

  // add body to request if data exist
  if (data) {
    requestInit.body = JSON.stringify(data)
  }

  const response = await fetch(url, requestInit)
  // toast error when response status is not ok
  if (!response.ok) {
    console.error('[request] !response.ok', response)
    message.error('请检查网络连接')
    // throw new Error("Network response was not ok");
    return {}
  }

  const json = await response.json()

  // toast error json.success not true
  if (!json.success) {
    console.error('[request] !json.success', json)
    message.error(json.message || '未知错误')
    // throw json;
    return {}
  }

  return json
}

/**
 * ### 将对象参数附加到 url 参数中：
 * - 如果 url 存在参数则二者 merge，
 * - 如果参数相同则覆盖已有参数
 * @param url 请求地址
 * @param params
 * @returns
 * @example
 * // 使用示例
 * const originalUrl = 'https://example.com?a=b';
 * const newParams = { foo: 'bar', foz: 'baz', arr: ['x', 'y'], empty: null };
 *
 * const newUrl = addParamsToUrl(originalUrl, newParams);
 * console.log(newUrl);
 * // 输出: https://example.com?a=b&foo=bar&foz=baz&arr=x&arr=y
 */
function addParamsToUrl(url: string, params: IFlatObject): string {
  // 创建 URL 对象
  const urlObj = new URL(url)

  // 获取现有的查询参数
  const searchParams = new URLSearchParams(urlObj.search)

  // 添加新的参数
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        // 如果是数组，添加多个相同键的参数
        value.forEach((item) => {
          if (item !== null && item !== undefined) {
            searchParams.append(key, String(item))
          }
        })
      } else {
        // 如果是单个值，直接设置或覆盖
        searchParams.set(key, String(value))
      }
    }
  })

  // 更新 URL 的查询字符串
  urlObj.search = searchParams.toString()

  // 返回完整的 URL
  return urlObj.toString()
}
// --- request.ts ends ---
