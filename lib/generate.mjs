import { compile } from 'json-schema-to-typescript';
import $RefParser from '@apidevtools/json-schema-ref-parser';
import { removePropertyTitle } from './remove-title.mjs';
import {
  genGenericRespType,
  isVariableName,
  replaceInlineIds,
} from './lite-lodash.mjs';
import { readJSONFile } from './fs.mjs';

export const MATCH_ALL = '*';

const Mark = { InPath: 'InPath' };

/**
 * Generates TypeScript definitions and request code from a given Swagger/OpenAPI JSON file.
 *
 * @param {import('node:fs').PathLike} filepath - The path to the Swagger/OpenAPI JSON file.
 * @param {IOpts} [opts]
 * @returns {Promise<{ list: IGeneratedItem[]; total: int; }>} - A promise that resolves to an array of compiled TypeScript definitions.
 */
export async function generateTSFromFile(filepath, opts = {}) {
  // Import the JSON schema from the specified file
  /** @type {IOpenAPISchema} */
  const jsonSchema = await readJSONFile(filepath.toString());

  // @ts-expect-error
  return generateTSFromSchema(jsonSchema, opts);
}

/**
 * @param {ICommonOpenAPISchema} schema
 * @param {{ api: string; method: string; }} opts
 */
function filterSchema(schema, opts) {
  const { api } = opts;
  if (api === MATCH_ALL) {
    return schema;
  }

  const { paths } = schema;
  const apiRegexp = new RegExp(api);

  const filteredPaths = Object.entries(paths).reduce(
    (/** @type {ICommonOpenAPISchema['paths']} */ acc, [path, pathItem]) => {
      // console.log('apiRegexp:', apiRegexp);
      // console.log('path, pathItem:', path, pathItem);
      if (apiRegexp.test(path)) {
        acc[path] = pathItem;
        return acc;
      }

      return acc;
    },
    {}
  );

  // schema.paths = filteredPaths;
  // return schema;

  return {
    ...schema,
    paths: filteredPaths,
  };
}

/**
 * Generates TypeScript definitions and request code from a given Swagger/OpenAPI JSON Schema.
 *
 * @param {ICommonOpenAPISchema} jsonSchema - Swagger OpenAPI JSON.
 * @param {IOpts} [opts]
 * @returns {Promise<{ list: IGeneratedItem[]; total: int; }>} - A promise that resolves to an array of compiled TypeScript definitions.
 */
export async function generateTSFromSchema(jsonSchema, opts = {}) {
  const {
    interfaceWithExport = false,
    functionWithExport = true,
    interfacePrefix = 'I',
    typesOnly = false,
    filter: filterConditions,
    debug = false,
  } = opts;

  if (debug) {
    console.log('[debug] jsonSchema', jsonSchema);
  }

  // @ts-expect-error
  filterConditions && (jsonSchema = filterSchema(jsonSchema, filterConditions));

  // console.log('filterConditions', filterConditions);
  // console.log('jsonSchema', jsonSchema);

  // @ts-expect-error
  const result = await generateTS(jsonSchema, debug);
  const total = result.length;

  let list = result;

  // if (filterConditions?.api === 'completions$') {
  //   console.log('filterConditions:', filterConditions);
  //   console.log('jsonSchema:', jsonSchema);
  //   // console.log('result:', result);
  // }

  if (interfacePrefix) {
    list = result.map((item) => ({
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
    }));
  }

  if (!interfaceWithExport) {
    list = list.map((item) => ({
      ...item,
      requestBodyType: removeExport(item.requestBodyType),
      requestParametersType: removeExport(item.requestParametersType),
      responseType: removeExport(item.responseType),
      genericResp: removeExport(item.genericResp),

      code: typesOnly ? undefined : generateCode(item, { functionWithExport }),
    }));
  }

  // console.error('filterConditions:', filterConditions);

  if (filterConditions) {
    const filtered = filter(list, filterConditions);

    return { total, list: filtered };
  }

  return { list, total };
}

/**
 * @param {string} type
 */
function removeExport(type) {
  // console.log('type:', type, '--end');
  return type.replace(/export /g, '');
}

/**
 * @param {string} prefix
 * @param {string} type
 */
function addPrefixToInterface(prefix, type) {
  const interfaces = findAllInterfaceNames(type);

  for (const interfaceName of interfaces) {
    type = type.replaceAll(interfaceName, `${prefix}${interfaceName}`);
  }

  return type;
}

/**
 * @param {string} type
 * @returns {string[]}
 */
function findAllInterfaceNames(type) {
  const matches = type.matchAll(/(?:interface|type)\s+(\w+)/g);

  return [...matches].map(([_, name]) => name);
}

/**
 * @param {string} args
 * @param {string} path
 * @returns {string}
 */
function rewritePath(args, path) {
  let hasStringInterpolation = false;

  if (args.includes('params:') && /\{\w+\}/.test(path)) {
    path = replaceInlineIds(path);
    hasStringInterpolation = true;
  }

  const quote = hasStringInterpolation ? '`' : "'";
  return quote + path + quote;
}

/**
 * @param {IGeneratedItemOnlyTypes} itemWithoutCode
 * @param {{ functionWithExport: boolean }} options
 * @returns {string}
 */
function generateCode(itemWithoutCode, { functionWithExport = true }) {
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
      const params = [];

      if (requestParametersType) {
        params.push(`params: ${extractInterfaceName(requestParametersType)}`);
      }

      if (requestBodyType) {
        params.push(`data: ${extractInterfaceName(requestBodyType)}`);
      }

      return params.join(', ');
    }

    function genParamsAndData() {
      const params = [];

      const interfaceName = extractInterfaceName(requestParametersType);

      if (requestParametersType && !interfaceName?.endsWith(Mark.InPath)) {
        params.push(`${indent(4)}params,`);
      }

      if (requestBodyType) {
        params.push(`${indent(4)}data,`);
      }

      return params.join(`\n`);
    }

    const responseTypeName = extractResponseDataTypeName(responseType);

    const respType = genericResp
      ? `Data<${responseTypeName}>`
      : (extractWholeResponseType(responseType) ?? responseTypeName);

    const respGeneric = responseType ? `<${respType}>` : '';
    const dataStr = genParamsAndData();

    const serviceFunctionName = resolveServiceFunctionName(itemWithoutCode);

    const args = genParams();
    path = rewritePath(args, path);

    return `/**
 * ${description}
 */
${functionWithExport ? 'export ' : ''}async function ${serviceFunctionName}(${args}) {
  return request${respGeneric}(${path}, {
    method: '${method}'${dataStr && `,\n${dataStr}`}
  });
}`;
  };

  const code = template(itemWithoutCode);

  return code;
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
    return 'FIXME!!!';
  }

  // Create Example For Internal
  // to
  // createExampleForInternal
  return summary[0].toLowerCase() + summary.slice(1).replace(/\s/g, '');
}

/**
 * @param {string} type
 */
function extractInterfaceName(type) {
  return type.match(/interface (\w+)/)?.[1];
}

/**
 * @param {string} str
 */
function extractResponseDataTypeName(str) {
  // `interface FooRespData { ... }`
  // `type FooRespData = ...`
  return str.match(/(?:interface|type) (\w+?RespData)/)?.[1];
}

/**
 * @param {string} str
 */
function extractWholeResponseType(str) {
  // console.log('str:', str, '__end');

  // `interface Foo__Resp__ { ... }`
  // `type Foo__Resp__ = ...`
  // => Foo
  return str.match(/(?:interface|type) (\w+?)__Resp__/)?.[1];
}

/**
 * @param {number} count
 */
function indent(count) {
  return ' '.repeat(count);
}

/**
 *
 * @param {IGeneratedItem[]} all
 * @param {IFilter} param1
 * @returns
 */
function filter(all, { api, method }) {
  // @ts-expect-error
  const apiPattern = api === MATCH_ALL ? api : new RegExp(api);
  /** @param {string} prop */
  const isMatchingAll = (prop) => prop === MATCH_ALL || prop === undefined;

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
  );
}

/**
 *
 * @param {IOpenAPISchema} jsonSchema
 * @returns {Promise<IGeneratedItemOnlyTypes[]>}
 */
export async function generateTS(jsonSchema, debug = false) {
  // Dereference any JSON references in the schema
  await $RefParser.dereference(jsonSchema);

  if (debug) {
    console.log('[debug] after dereference jsonSchema:', jsonSchema);
    // console.log(
    //   '[debug] paths /getAccConfig',
    //   jsonSchema.paths['/getAccConfig'].post
    // );
  }
  // Remove the 'title' property from the schema
  removePropertyTitle(jsonSchema);

  // Compile the Swagger/OpenAPI JSON schema into TypeScript definitions
  const result = await compileSwaggerJSON(jsonSchema);

  // Return the compiled TypeScript definitions
  return result;
}

let genericResp = '';

/**
 *
 * @param {IOpenAPISchema} jsonSchema
 * @returns
 */
async function compileSwaggerJSON(jsonSchema) {
  const result = [];
  // const prefix = jsonSchema.basePath;

  for (const [path, value] of Object.entries(jsonSchema.paths)) {
    const methods = Object.entries(value);

    for (const [method, value] of methods) {
      const httpMethod = method.toUpperCase();
      // path.includes === 'coupon' && console.log('value:', value);
      // console.log('value:', value);

      if (httpMethod === 'OPTIONS') {
        continue;
      }

      const { operationId } = value;

      if (!operationId) {
        // 2.0 版本没有 operationId
        // console.log('[debug] no operationId', value);
        // continue;
      }

      const { parameters = [], requestBody, responses, tags = [] } = value;
      let { description, summary } = value;

      // 有空格或者包含中文，则当做 description
      const isSentence = /\s/.test(summary) || /\W/.test(summary);
      if (isSentence) {
        // 如果 summary 是中文，则将其当做 description
        description = summary;
      }

      const groupLabel = tags[0] || '';

      if (isVariableName(summary)) {
        // do nothing
      } else {
        // change summary when summary is not English
        // 2.0 版本没有 operationId
        summary = operationId ?? path.replace(/[^\w_]/g, '');
      }

      // console.log('description:', { description, summary });

      console.assert(!!summary, 'summary:', summary, 'value:', value);

      const okResponse = responses?.['200'];
      const content = okResponse?.content;
      let responseSchema = content
        ? (content['application/json'] || content['*/*'])?.schema
        : okResponse.schema;

      if (!responseSchema) {
        console.warn('[swaggered] !responseSchema in value:', value);
        // continue;
        responseSchema = {};
      }
      // 2.0 allOf 无法编译出 response
      // 没有好的办法识别，只能取第二个
      if (responseSchema.allOf?.length >= 2) {
        responseSchema = responseSchema.allOf.at(-1);
      }

      // path === '/getAccConfig' &&
      //   console.log('responseSchema:', responseSchema);

      // console.log('summary1:', summary, value);

      // console.log({
      //   path,
      //   method: httpMethod,
      //   operationId,
      //   // parameters,
      //   // requestBody,
      //   // requestBodySchema,
      //   // responses,
      //   responseSchema,
      // });

      /**
       *
       * @param {ISwaggerParameter[]} parameters
       * @param {string} mark
       * @returns {ISchema}
       */
      function toSchema(parameters, mark) {
        const title = summary.replace(/\s/g, '') + 'Params' + mark;
        // console.log('summary2:', summary, title);

        /** @type {string[]} */
        const required = [];

        return parameters.reduce(
          (acc, item) => {
            const name = item.name;
            if (name === 'x-jwt-payload') {
              return acc;
            }

            // @ts-expect-error
            acc.properties[name] = {
              ...item,
              ...item.schema,
              schema: null,
              title: '',
            };

            item.required && required.push(name);
            return acc;
          },
          { properties: {}, type: 'object', title, required }
        );
      }

      /** @param {ISwaggerParameter[]} parameters */
      async function generateParameterType(parameters) {
        parameters = parameters.filter((item) => item.name !== 'x-jwt-payload');

        // in body query path header
        const params = parameters.filter(
          (item) => item.in === 'query' || item.in === 'path'
        );

        // console.log('params:', params);

        if (!params.length) {
          return '';
        }

        let mark = '';

        // when all parameters are not in query the params object will be removed
        // because all the params has been consumed by the url (in path)
        if (parameters.every((item) => item.in !== 'query')) {
          mark = Mark.InPath;
        }

        const parameterSchema = toSchema(params, mark);

        // if (path.includes('api_keys') && httpMethod === 'GET') {
        //   console.log('parameters:', parameters);
        //   console.log('parameterSchema:', parameterSchema);
        // }

        // @ts-expect-error Type 'string' is not assignable to type 'JSONSchema4TypeName | JSONSchema4TypeName[] | undefined'
        return await myCompile(parameterSchema);
      }

      const requestParametersType = await generateParameterType(parameters);

      const requestBodyInParameters = parameters.find(
        // @ts-expect-error
        (item) => item.in === 'body'
      )?.schema;

      // console.log('requestBodyInParameters:', requestBodyInParameters);

      const requestBodySchema =
        requestBodyInParameters ??
        requestBody?.content?.['application/json']?.schema;

      // @ts-expect-error
      async function genRequestBodyType(requestBodySchema) {
        if (!requestBodySchema) {
          return '';
        }

        if (!requestBodySchema.title) {
          requestBodySchema.title = summary + 'ReqData';
        }

        return myCompile(requestBodySchema, path);
      }

      const requestBodyType = await genRequestBodyType(requestBodySchema);
      // console.log('responseSchema:', responseSchema);
      // if (path.includes('job/create')) {
      //   console.log(
      //     'requestBodySchema:',
      //     JSON.stringify(requestBodySchema, null, 2)
      //   );
      //   console.log('requestBodyType:|', requestBodyType, '|');
      // }

      if (responseSchema.properties) {
        const data = responseSchema.properties.data;
        const respBodyData = !data
          ? responseSchema.properties
          : (data.anyOf?.[0] ?? data);

        // const title = respBodyData.title;
        respBodyData.title = summary.replace(/\s/g, '') + 'RespData';

        if (!genericResp) {
          genericResp = await genGenericRespType(responseSchema);
        }
      }

      // console.log('responseSchema:', responseSchema);
      // console.log('responseSchema.properties:', responseSchema.properties);
      // console.log('genericResp:', genericResp);

      // 无需生成最外层的类型，genGenericRespType 已经生成了
      if (genericResp) {
        // remove the whole response type due to the generated Data<T>
        responseSchema.title = '';
      } else if (responseSchema.title) {
        // mark the whole response type and it will used in the request<WholeRespType>
        responseSchema.title = responseSchema.title + '__Resp__';
      }

      // console.log('responseSchema:', responseSchema);

      const responseType = await myCompile(responseSchema);
      // console.log('responseType:', responseType);
      // if (path.includes('job/create')) {
      //   console.log('responseSchema:', JSON.stringify(responseSchema, null, 2));
      //   console.log('responseType:|', responseType, '|');
      // }
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
      };

      result.push(compiledRequest);
    }
  }

  return result;
}

/**
 * @param {import("json-schema").JSONSchema4} schema
 */
async function myCompile(schema, _path = '') {
  const type = await compile(schema, '', {
    bannerComment: '',
    additionalProperties: false,
  });

  // if (path.includes('job/create')) {
  //   console.log('schema:', schema);
  //   console.log('type:', type, '--end');
  // }

  return type.trim();
}

/**
 * @typedef {import('../assets/openapi-apiserver-simple.json')} IOpenAPISchema
 */
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

/**
 * @typedef IOpts
 * @property {boolean} [interfaceWithExport] prefix `export` to all `interface`s. default `false`
 * @property {boolean} [functionWithExport] prefix `export` to all `function`s. default `true`
 * @property {string} [interfacePrefix] prefix to all `interface`s. default `""`
 * @property {boolean} [typesOnly] generate types only. default `false`
 * @property {boolean} [debug] default `false`
 * @property {IFilter} [filter] API filter conditions
 */

/**
 * @typedef IFilter API filter conditions
 * @property {string} [filter.api] api path. default '*'
 * @property {string} [filter.method] HTTP method. default '*'
 */

/** @typedef {IOpenAPISchema['paths']['/api/foo/v1/bar']['post']['parameters'][0]} ISwaggerParameter */

/** @typedef {number} int */
