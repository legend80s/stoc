import { readFileSync } from 'node:fs'
import { posix, resolve } from 'node:path'
import $RefParser from '@apidevtools/json-schema-ref-parser'
import { compile } from 'json-schema-to-typescript'

import { readJSONFile } from './fs.mjs'
import {
  addRangeToDescription,
  genGenericRespType,
  getCircularReplacer,
  isVariableName,
  pathToCamelCase,
  replaceInlineIds,
} from './lite-lodash.mjs'
import { logger } from './logger.mjs'
import { removePropertyTitle } from './remove-title.mjs'
import { filterSchema, getBasePath, MATCH_ALL } from './schema.mjs'

const Mark = { InPath: 'InPath' }

/** @import { IOpenAPISchema, IFilter, IGenerateOptions } from '../lib/typing' */
/** @import {ICommonOpenAPISchema} from '../index' */

/**
 * Generates TypeScript definitions and request code from a given Swagger/OpenAPI JSON file.
 *
 * @param {import('node:fs').PathLike} filepath - The path to the Swagger/OpenAPI JSON file.
 * @param {IGenerateOptions} [opts]
 * @returns {ReturnType<typeof generateTSFromSchema>} - A promise that resolves to an array of compiled TypeScript definitions.
 */
export async function generateTSFromFile(filepath, opts = {}) {
  // Import the JSON schema from the specified file
  /** @type {IOpenAPISchema} */
  const jsonSchema = await readJSONFile(filepath.toString())

  // @ts-expect-error
  return generateTSFromSchema(jsonSchema, opts)
}

/**
 * Generates TypeScript definitions and request code from a given Swagger/OpenAPI JSON Schema.
 *
 * @param {ICommonOpenAPISchema} jsonSchema - Swagger OpenAPI JSON.
 * @param {IGenerateOptions} [opts]
 * @returns {Promise<{ list: IGeneratedItem[]; total: int; codeBefore?: string, basePath: string }>} - A promise that resolves to an array of compiled TypeScript definitions.
 */
export async function generateTSFromSchema(jsonSchema, opts = {}) {
  const {
    interfaceWithExport = false,

    functionWithExport = true,
    explicitReturnTypeAttached = true,

    interfacePrefix = 'I',
    typesOnly = false,
    filter: filterConditions,
    debug = false,
    request: shouldGenerateRequestCode = true,
  } = opts

  logger.log('jsonSchema', jsonSchema)

  // biome-ignore lint/suspicious/noAssignInExpressions: it works
  filterConditions && (jsonSchema = filterSchema(jsonSchema, filterConditions))

  // console.error('filterConditions:', filterConditions)
  // console.error('jsonSchema.paths after filter:', jsonSchema.paths)

  // @ts-expect-error
  const result = await generateTS(jsonSchema, debug)
  const total = result.length

  const basePath = getBasePath(jsonSchema) || ''

  let list = result.map((item) => ({
    ...item,

    path: joinPath(basePath, item.path),
  }))

  // if (filterConditions?.api === 'completions$') {
  //   console.log('filterConditions:', filterConditions);
  //   console.log('jsonSchema:', jsonSchema);
  //   // console.log('result:', result);
  // }

  if (interfacePrefix) {
    list = list.map((item) => ({
      ...item,
      requestBodyType: addPrefixToInterface(
        interfacePrefix,
        item.requestBodyType
      ),
      requestParametersType: addPrefixToInterface(
        interfacePrefix,
        item.requestParametersType
      ),
      responseType: addPrefixToInterface(interfacePrefix, item.responseType),
    }))
  }

  if (!interfaceWithExport) {
    list = list.map((item) => ({
      ...item,
      requestBodyType: removeExport(item.requestBodyType),
      requestParametersType: removeExport(item.requestParametersType),
      responseType: removeExport(item.responseType),
      genericResp: removeExport(item.genericResp),

      code: typesOnly
        ? undefined
        : generateCode(item, {
            functionWithExport,
            explicitReturnTypeAttached,
          }),
    }))
  }

  // console.error('filterConditions:', filterConditions);

  const requestCode =
    typesOnly || !shouldGenerateRequestCode ? undefined : generateRequest()

  if (filterConditions) {
    const filtered = filter(list, filterConditions)

    return {
      total,
      list: filtered,
      codeBefore: requestCode,
      basePath,
    }
  }

  return {
    list,
    total,
    codeBefore: requestCode,
    basePath,
  }
}

function generateRequest() {
  // read file template from ../templates/request.ts
  const __dirname = import.meta.dirname

  const template = readFileSync(
    resolve(__dirname, '../templates/request.ts'),
    'utf-8'
  )

  return template
}

/**
 * @param {string} type
 */
function removeExport(type) {
  // console.log('type:', type, '--end');
  return type.replace(/export /g, '')
}

/**
 * @param {string} prefix
 * @param {string} type
 */
function addPrefixToInterface(prefix, type) {
  const interfaces = findAllInterfaceNames(type)

  for (const interfaceName of interfaces) {
    type = type.replaceAll(interfaceName, `${prefix}${interfaceName}`)
  }

  return type
}

/**
 * @param {string} type
 * @returns {string[]}
 */
function findAllInterfaceNames(type) {
  const matches = type.matchAll(/(?:interface|type)\s+(\w+)/g)

  return [...matches].map(([_, name]) => name)
}

/**
 * @param {string} args
 * @param {string} path
 * @returns {string}
 */
function rewritePath(args, path) {
  let hasStringInterpolation = false

  if (args.includes('params:') && /\{\w+\}/.test(path)) {
    path = replaceInlineIds(path)
    hasStringInterpolation = true
  }

  const quote = hasStringInterpolation ? '`' : "'"
  return quote + path + quote
}

/**
 * @param {IGeneratedItemOnlyTypes} itemWithoutCode
 * @param {{ functionWithExport: boolean; explicitReturnTypeAttached: boolean; }} options
 * @returns {string}
 */
function generateCode(
  itemWithoutCode,
  { functionWithExport = true, explicitReturnTypeAttached = true }
) {
  /**
   *
   * @param {IGeneratedItemOnlyTypes} item
   * @returns
   */
  const template = ({
    responseType,
    requestBodyType,
    requestParametersType,
    method,
    path,
    summary,
    description = summary,
    genericResp,
  }) => {
    function genParams() {
      const params = []

      if (requestParametersType) {
        params.push(`params: ${extractInterfaceName(requestParametersType)}`)
      }

      if (requestBodyType) {
        params.push(`data: ${extractInterfaceName(requestBodyType)}`)
      }

      return params.join(', ')
    }

    function genParamsAndData() {
      const params = []

      const interfaceName = extractInterfaceName(requestParametersType)

      if (requestParametersType && !interfaceName?.endsWith(Mark.InPath)) {
        params.push(`${indent(4)}params,`)
      }

      if (requestBodyType) {
        params.push(`${indent(4)}data,`)
      }

      return params.join(`\n`)
    }

    const responseTypeName = extractResponseDataTypeName(responseType)

    const respType = genericResp
      ? `Data<${responseTypeName}>`
      : (extractWholeResponseType(responseType) ?? responseTypeName)

    const respGeneric = responseType ? `<${respType}>` : ''
    const dataStr = genParamsAndData()

    const serviceFunctionName = resolveServiceFunctionName(itemWithoutCode)

    const args = genParams()
    path = rewritePath(args, path)

    const returnType =
      explicitReturnTypeAttached && respGeneric ? `: Promise${respGeneric}` : ''

    return `/**
 * ${description}
 */
${functionWithExport ? 'export ' : ''}async function ${serviceFunctionName}(${args})${returnType} {
  return request${respGeneric}(${path}, {
    method: '${method}'${dataStr && `,\n${dataStr}`}
  });
}`
  }

  const code = template(itemWithoutCode)

  return code
}

/**
 * @param {IGeneratedItemOnlyTypes} itemWithoutCode
 * @returns {string}
 */
function resolveServiceFunctionName({ summary }) {
  // const interfaceName = extractInterfaceName(
  //   requestParametersType || requestBodyType
  // );

  if (!summary) {
    return 'FIXME!!!'
  }

  // Create Example For Internal
  // to
  // createExampleForInternal
  return summary[0].toLowerCase() + summary.slice(1).replace(/\s/g, '')
}

/**
 * @param {string} type
 */
function extractInterfaceName(type) {
  return type.match(/interface (\w+)/)?.[1]
}

/**
 * @param {string} str
 */
function extractResponseDataTypeName(str) {
  // `interface FooResponseData { ... }`
  // `type FooResponseData = ...`
  return str.match(/(?:interface|type) (\w+?ResponseData)/)?.[1]
}

/**
 * @param {string} str
 */
function extractWholeResponseType(str) {
  // console.log('str:', str, '__end');

  // `interface Foo__Resp__ { ... }`
  // `type Foo__Resp__ = ...`
  // => Foo
  return str.match(/(?:interface|type) (\w+?)__Resp__/)?.[1]
}

/**
 * @param {number} count
 */
function indent(count) {
  return ' '.repeat(count)
}

/**
 *
 * @param {IGeneratedItem[]} all
 * @param {IFilter} param1
 * @returns
 */
function filter(all, { api, method }) {
  return all
  // @ts-expect-error
  const apiPattern = api === MATCH_ALL ? api : new RegExp(api)
  /** @param {string} prop */
  const isMatchingAll = (prop) => prop === MATCH_ALL || prop === undefined

  return (
    all
      // @ts-expect-error
      .filter((item) => isMatchingAll(api) || apiPattern.test(item.path))
      .filter(
        (item) =>
          // @ts-expect-error
          isMatchingAll(method) ||
          item.method.toLowerCase() === method?.toLowerCase()
      )
  )
}

/**
 *
 * @param {IOpenAPISchema} jsonSchema
 * @returns {Promise<IGeneratedItemOnlyTypes[]>}
 */
export async function generateTS(jsonSchema, debug = false) {
  // Dereference any JSON references in the schema
  // console.time('dereference')
  removePropertyTitle(jsonSchema)

  await $RefParser.dereference(jsonSchema)
  // console.log('jsonSchema:', jsonSchema)

  // 用 debug 避免正常情况下 JSON.stringify 的运行，消耗 CPU
  debug &&
    logger.log(
      'after dereference jsonSchema:',
      JSON.stringify(jsonSchema, getCircularReplacer())
    )
  // console.timeEnd('dereference') // 13.313ms

  // console.log(
  //   '[debug] paths /getAccConfig',
  //   jsonSchema.paths['/getAccConfig'].post
  // );

  // Remove the 'title' property from the schema

  // Compile the Swagger/OpenAPI JSON schema into TypeScript definitions
  const result = await compileSwaggerJSON(jsonSchema)

  // Return the compiled TypeScript definitions
  return result
}

let genericResp = ''

/**
 *
 * @param {IOpenAPISchema} jsonSchema
 * @returns
 */
async function compileSwaggerJSON(jsonSchema) {
  const result = []

  // console.error('jsonSchema.basePath:', jsonSchema.basePath)

  for (const [path, value] of Object.entries(jsonSchema.paths)) {
    const methods = Object.entries(value)

    for (const [method, value] of methods) {
      const httpMethod = method.toUpperCase()
      // path.includes === 'coupon' && console.log('value:', value);
      // console.error(path, '=>', value)

      if (httpMethod === 'OPTIONS') {
        continue
      }

      const { operationId } = value

      if (!operationId) {
        // 2.0 版本没有 operationId
        // console.log('[debug] no operationId', value);
        // continue;
      }

      const { parameters = [], requestBody, responses, tags = [] } = value
      let { description, summary } = value
      // console.error('responses', responses)

      // 有空格或者包含中文，则当做 description
      const isSentence = /\s/.test(summary) || /\W/.test(summary)
      if (isSentence) {
        // 如果 summary 是中文，则将其当做 description
        description = summary
      }

      const groupLabel = tags[0] || ''

      // operationId 有时候太长了，故选择较短的 summary
      if (isVariableName(summary) && summary.length <= operationId.length) {
        // do nothing
      } else {
        // change summary when summary is not English
        // 2.0 版本没有 operationId
        // path /lightModel/create to camelCase createLightModel
        summary = operationId ?? pathToCamelCase(path)
        // summary = operationId ?? path.replace(/[^\w_]/g, '')
      }

      // console.error('description:', { operationId, description, summary })

      console.assert(!!summary, 'summary:', summary, 'value:', value)

      /** @type {undefined | { [key: string]: any } } */
      const okResponse = responses?.['200']

      const content = okResponse?.content
      let responseSchema = content
        ? (content['application/json'] || content['*/*'])?.schema
        : okResponse?.schema

      if (!responseSchema) {
        logger.warn('[swaggered] !responseSchema in value:', value)
        // continue;
        responseSchema = {}
      }
      // 2.0 allOf 无法编译出 response
      // 没有好的办法识别，只能取第二个
      if (responseSchema.allOf?.length >= 2) {
        responseSchema = responseSchema.allOf.at(-1)
      }

      // console.log('summary1:', summary, value);

      // console.log('all', {
      //   path,
      //   method: httpMethod,
      //   operationId,
      //   // parameters,
      //   // requestBody,
      //   // requestBodySchema,
      //   // responses,
      //   responseSchema,
      // })

      /**
       *
       * @param {ISwaggerParameter[]} parameters
       * @param {string} mark
       * @returns {ISchema}
       */
      function toSchema(parameters, mark) {
        const title = `${removeWhitespace(summary)}Params${mark}`
        // console.log('summary2:', summary, title);

        /** @type {string[]} */
        const required = []

        return parameters.reduce(
          (acc, item) => {
            const name = item.name
            if (name === 'x-jwt-payload') {
              return acc
            }

            // @ts-expect-error
            acc.properties[name] = {
              ...item,
              ...item.schema,
              schema: null,
              title: '',
            }

            item.required && required.push(name)
            return acc
          },
          { properties: {}, type: 'object', title, required }
        )
      }

      /** @param {ISwaggerParameter[]} parameters */
      async function generateParameterType(parameters) {
        parameters = parameters.filter((item) => item.name !== 'x-jwt-payload')

        // in body query path header
        const params = parameters.filter(
          (item) => item.in === 'query' || item.in === 'path'
        )

        // console.log('params:', params);

        if (!params.length) {
          return ''
        }

        let mark = ''

        // when all parameters are not in query the params object will be removed
        // because all the params has been consumed by the url (in path)
        if (parameters.every((item) => item.in !== 'query')) {
          mark = Mark.InPath
        }

        const parameterSchema = toSchema(params, mark)

        // if (path.includes('api_keys') && httpMethod === 'GET') {
        //   console.log('parameters:', parameters);
        //   console.log('parameterSchema:', parameterSchema);
        // }

        // @ts-expect-error Type 'string' is not assignable to type 'JSONSchema4TypeName | JSONSchema4TypeName[] | undefined'
        return await myCompile(parameterSchema)
      }

      const requestParametersType = await generateParameterType(parameters)

      const requestBodyInParameters = parameters.find(
        // @ts-expect-error
        (item) => item.in === 'body'
      )?.schema

      // console.log('requestBodyInParameters:', requestBodyInParameters);

      const requestBodySchema =
        requestBodyInParameters ??
        requestBody?.content?.['application/json']?.schema

      // @ts-expect-error
      async function genRequestBodyType(requestBodySchema) {
        if (!requestBodySchema) {
          return ''
        }
        // console.log('summary:', summary, path, requestBodySchema.title)

        // if (!requestBodySchema.title) {
        requestBodySchema = {
          ...requestBodySchema,
          title: `${summary}RequestData`,
        }
        // }

        return myCompile(requestBodySchema, path)
      }

      const requestBodyType = await genRequestBodyType(requestBodySchema)
      // console.log('responseSchema:', responseSchema)
      // if (path.includes('job/create')) {
      //   console.log(
      //     'requestBodySchema:',
      //     JSON.stringify(requestBodySchema, null, 2)
      //   );
      //   console.log('requestBodyType:|', requestBodyType, '|');
      // }
      const respTitle = `${removeWhitespace(summary)}ResponseData`

      if (responseSchema.properties) {
        const data = responseSchema.properties.data
        const hasData = !!data

        const respBodyData = !hasData
          ? responseSchema.properties
          : (data.anyOf?.[0] ?? data)

        // const title = respBodyData.title;
        hasData &&
          // biome-ignore lint/suspicious/noAssignInExpressions: it is intentional
          (respBodyData.title = respTitle)

        logger.log('respBodyData.title:', respBodyData.title)

        if (!genericResp) {
          genericResp = await genGenericRespType(responseSchema)
        }
      }

      // console.error('responseSchema 622:', responseSchema.title)
      // console.error('responseSchema.properties:', responseSchema.properties)
      // console.error('genericResp:', genericResp)

      // 无需生成最外层的类型，genGenericRespType 已经生成了
      // title 非常重要，没有则不能生成类型！
      if (genericResp) {
        // data: { type: 'object', properties: [Object], title: 'listFooResponseData' },
        // We should attach the title to data instead of responseSchema thus only one `xxResponseData` type will be generated
        // the whole response type will be wrapped in generic type: `ListFooResponseData = Data<ListFooResponseData>`
        // 如果存在 data 通用结构的返回值类型。则只需将 title 附加到 data 上，因为我们只需要给 data 生成类型即可，最终的类型是 { code: xx, data: xx }
        // 否则会生成冗余类型
        responseSchema.title = ''
      } else if (responseSchema.title) {
        // mark the whole response type and it will used in the request<WholeRespType>
        responseSchema.title = `${responseSchema.title}__Resp__`
      } else {
        responseSchema.title = respTitle
      }

      // console.log('responseSchema after title attached:', responseSchema)
      const testPath = '/api/bar/v1/baz/foo/list'
      // const testPath = ''/1/indexes/products/query''
      if (path.includes(testPath)) {
        // responseSchema.title = 'searchProductsResponseData'
      }
      const responseType = await myCompile(responseSchema)
      if (path.includes(testPath)) {
        // console.log('genericResp:', genericResp)
        // console.log('responseSchema:', responseSchema)
        // console.log('responseSchema:', JSON.stringify(responseSchema, null, 2));
        // console.log(`responseType:|${responseType}|`)
      }
      /** @type {IGeneratedItem} */
      const compiledRequest = {
        path,
        method: httpMethod,
        // operationId,
        requestParametersType,
        requestBodyType,
        responseType,
        summary,
        description,
        group: groupLabel,
        genericResp,
      }

      result.push(compiledRequest)
    }
  }

  return result
}

/**
 * @param {import("json-schema").JSONSchema4} schema
 */
async function myCompile(schema, _path = '') {
  addRangeToSchemaDescription(schema)

  const type = await compile(schema, '', {
    bannerComment: '',
    additionalProperties: false,
  })

  // if (path.includes('job/create')) {
  //   console.log('schema:', schema);
  //   console.log('type:', type, '--end');
  // }

  return type.trim()
}

/**
 * @param {import("json-schema").JSONSchema4} schema
 * @returns {void}
 */
function addRangeToSchemaDescription(schema) {
  const properties = schema.properties
  // console.error(schema.properties)

  properties &&
    Object.keys(properties).forEach((key) => {
      const item = properties[key]
      const {
        description,
        minLength,
        maxLength,
        minimum,
        maximum,
        exclusiveMinimum,
        exclusiveMaximum,
      } = item

      if (description) {
        item.description = addRangeToDescription(description, {
          minLength,
          maxLength,
          minimum,
          maximum,
          exclusiveMaximum,
          exclusiveMinimum,
        })
      }
    })

  // console.error('schema.properties:', schema.properties)
}

/**
 *
 * @param {string} str
 * @returns {string}
 */
function removeWhitespace(str) {
  return str.replace(/\s/g, '')
}

/**
 *
 * @param {string | undefined} basePath
 * @param {string} path
 * @returns {string}
 */
function joinPath(basePath, path) {
  if (basePath) {
    // Use `posix.join` to generate `/` as separator even on Windows.
    return path.startsWith(basePath) ? path : posix.join(basePath, path)
  }

  return path
}

/**
 * @typedef {Omit<IOpenAPISchema['components']['schemas']['CreateBarRequest'], 'properties'> & { properties: Record<string, { type: string; title: string; description: string; }>}} ISchema
 */

/**
 * @typedef IGeneratedItemOnlyTypes
 * @property {string} path API path
 * @property {string} method HTTP method
 * @property {string} requestParametersType HTTP request parameters type
 * @property {string} requestBodyType HTTP request body type
 * @property {string} responseType HTTP response type
 * @property {string} genericResp Generic response type
 * @property {string} summary API summary
 * @property {string} [description] API description
 * @property {string} group API group
 */

/** @typedef {IGeneratedItemOnlyTypes & { code?: string }} IGeneratedItem */

/** @typedef {IOpenAPISchema['paths']['/api/foo/v1/bar']['post']['parameters'][0]} ISwaggerParameter */

/** @typedef {number} int */
