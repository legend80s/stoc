import { compile } from 'json-schema-to-typescript';
import $RefParser from '@apidevtools/json-schema-ref-parser';
import { removePropertyTitle } from './remove-title.mjs';

export const MATCH_ALL = '*';

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
  const jsonSchema = (
    await import(filepath.toString(), {
      assert: { type: 'json' },
    })
  ).default;

  return generateTSFromSchema(jsonSchema, opts);
}

/**
 * Generates TypeScript definitions and request code from a given Swagger/OpenAPI JSON Schema.
 *
 * @param {IOpenAPISchema} jsonSchema - Swagger OpenAPI JSON.
 * @param {IOpts} [opts]
 * @returns {Promise<{ list: IGeneratedItem[]; total: int; }>} - A promise that resolves to an array of compiled TypeScript definitions.
 */
export async function generateTSFromSchema(jsonSchema, opts = {}) {
  const {
    interfaceWithExport = false,
    interfacePrefix = '',
    typesOnly = false,
    filter: filterConditions,
  } = opts;

  const result = await generateTS(jsonSchema);
  const total = result.length;

  let list = result;

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

      code: typesOnly ? undefined : generateCode(item),
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
  return type.replace(/export /g, '');
}

/**
 * @param {string} prefix
 * @param {string} type
 */
function addPrefixToInterface(prefix, type) {
  return type.replace(/interface /g, `interface ${prefix}`);
}

/**
 * @param {IGeneratedItemOnlyTypes} itemWithoutCode
 * @returns {string}
 */
function generateCode(itemWithoutCode) {
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

      if (requestParametersType) {
        params.push(`${indent(4)}params,`);
      }

      if (requestBodyType) {
        params.push(`${indent(4)}data,`);
      }

      return params.join(`\n`);
    }

    const responseTypeName = extractResponseDataTypeName(responseType);
    const respGeneric = responseType ? `<Data<${responseTypeName}>>` : '';
    const dataStr = genParamsAndData();

    const serviceFunctionName = resolveServiceFunctionName(itemWithoutCode);

    return `export async function ${serviceFunctionName}(${genParams()}) {
  return request${respGeneric}('${path}', {
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
  // `interface FooRespData`
  return str.match(/interface (\w+?RespData)/)?.[1];
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
export function filter(all, { api, method }) {
  const apiPattern = api === MATCH_ALL ? api : new RegExp(api);
  /** @param {string} prop */
  const isMatchingAll = (prop) => prop === MATCH_ALL || prop === undefined;

  return all
    .filter((item) => isMatchingAll(api) || apiPattern.test(item.path))
    .filter(
      (item) =>
        isMatchingAll(method) ||
        item.method.toLowerCase() === method.toLowerCase()
    );
}

/**
 *
 * @param {IOpenAPISchema} jsonSchema
 * @returns {Promise<IGeneratedItemOnlyTypes[]>}
 */
export async function generateTS(jsonSchema) {
  // Dereference any JSON references in the schema
  await $RefParser.dereference(jsonSchema);

  // Remove the 'title' property from the schema
  removePropertyTitle(jsonSchema);

  // Compile the Swagger/OpenAPI JSON schema into TypeScript definitions
  const result = await compileSwaggerJSON(jsonSchema);

  // Return the compiled TypeScript definitions
  return result;
}

/**
 *
 * @param {IOpenAPISchema} jsonSchema
 * @returns
 */
async function compileSwaggerJSON(jsonSchema) {
  const result = [];

  for (const [path, value] of Object.entries(jsonSchema.paths)) {
    const methods = Object.entries(value);

    for (const [method, value] of methods) {
      const httpMethod = method.toUpperCase();

      if (httpMethod === 'OPTIONS') {
        continue;
      }

      const { operationId } = value;

      if (!operationId) {
        continue;
      }

      const { parameters, requestBody, responses, summary } = value;

      const requestBodySchema =
        requestBody?.content?.['application/json']?.schema;
      const responseSchema =
        responses?.['200']?.content?.['application/json']?.schema;

      if (!responseSchema) {
        continue;
      }

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
       * @returns {ISchema}
       */
      function toSchema(parameters) {
        const title = summary.replace(/\s/g, '') + 'Params';

        /** @type {string[]} */
        const required = [];

        return parameters.reduce(
          (acc, item) => {
            const name = item.name;
            if (name === 'x-jwt-payload') {
              return acc;
            }

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
        parameters = parameters?.filter(
          (item) => item.name !== 'x-jwt-payload'
        );

        if (!parameters?.length) {
          return '';
        }

        const parameterSchema = toSchema(parameters);

        // if (path.includes('api_keys') && httpMethod === 'GET') {
        //   console.log('parameters:', parameters);
        //   console.log('parameterSchema:', parameterSchema);
        // }

        // @ts-expect-error Type 'string' is not assignable to type 'JSONSchema4TypeName | JSONSchema4TypeName[] | undefined'
        return await myCompile(parameterSchema);
      }

      const requestParametersType = await generateParameterType(parameters);
      const requestBodyType = !requestBodySchema
        ? ''
        : await myCompile(requestBodySchema);

      if (responseSchema.properties) {
        const respBodyData = responseSchema.properties.data.anyOf[0];
        // const title = respBodyData.title;
        respBodyData.title =
          // title
          //   ? title.endsWith('Data')
          //     ? title
          //     : title + 'Data'
          //   :

          summary.replace(/\s/g, '') + 'RespData';
      }

      const responseType = await myCompile(responseSchema);

      const compiledRequest = {
        path,
        method: httpMethod,
        // operationId,
        requestParametersType,
        requestBodyType,
        responseType,
        summary,
      };

      result.push(compiledRequest);
    }
  }
  return result;
}

/**
 * @param {import("json-schema").JSONSchema4} schema
 */
async function myCompile(schema) {
  return (
    await compile(schema, '', {
      bannerComment: '',
      additionalProperties: false,
    })
  ).trim();
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
 * @property {string} summary API description
 */

/** @typedef {IGeneratedItemOnlyTypes & { code?: string }} IGeneratedItem */

/**
 * @typedef IOpts
 * @property {boolean} [interfaceWithExport] prefix `export` to all `interface`s. default `false`
 * @property {string} [interfacePrefix] prefix to all `interface`s. default `""`
 * @property {boolean} [typesOnly] generate types only. default `false`
 * @property {IFilter} [filter] API filter conditions
 */

/**
 * @typedef IFilter API filter conditions
 * @property {string} filter.api api path. default '*'
 * @property {string} filter.method HTTP method. default '*'
 */

/** @typedef {IOpenAPISchema['paths']['/api/foo/v1/bar/{bar_id}']['delete']['parameters'][0]} ISwaggerParameter */

/** @typedef {number} int */
