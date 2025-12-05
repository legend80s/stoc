/** @import {ICommonOpenAPISchema} from '../index' */

import { stripHost } from './lite-lodash.mjs'

export const MATCH_ALL = '*'

/**
 * @param {ICommonOpenAPISchema} jsonSchema - Swagger OpenAPI JSON.
 * @returns {string | undefined} - Base path.
 */
export function getBasePath(jsonSchema) {
  /** @type {string | undefined} */
  const basePath =
    // basePath (Swagger 2.0)
    'swagger' in jsonSchema
      ? jsonSchema.basePath
      : // servers (OpenAPI 3.x)
        stripHost(jsonSchema.servers?.[0].url)

  return basePath
}

/** @param {undefined | string} prop */
const isMatchingAll = (prop) => prop === MATCH_ALL || prop === undefined

/**
 * @template {ICommonOpenAPISchema} T
 * @param {T} schema
 * @param {{ api?: string; method?: string; }} opts
 * @returns {T}
 */
export function filterSchema(schema, { api, method }) {
  if (isMatchingAll(api) && isMatchingAll(method)) {
    return schema
  }

  const { paths = {} } = schema
  const apiRegexp = api && new RegExp(api)

  const filteredPaths = Object.entries(paths).reduce(
    (
      /** @type {NonNullable<ICommonOpenAPISchema['paths']>} */ acc,
      [path, pathItem]
    ) => {
      // console.error('apiRegexp:', apiRegexp)
      // console.error('path, pathItem test?:', path, pathItem, apiRegexp.test(path))

      if (!apiRegexp || apiRegexp.test(path)) {
        const item = filterPathItemByMethod(pathItem, method)

        if (Object.keys(item).length) {
          acc[path] = item
        }

        return acc
      }

      return acc
    },
    {}
  )

  // schema.paths = filteredPaths;
  // return schema;

  return {
    ...schema,
    paths: filteredPaths,
  }
}

/**
 *
 * @param {any} pathItem - `{ put: {}, post: {}}`
 * @param {string | undefined} targetMethod
 */
function filterPathItemByMethod(pathItem, targetMethod) {
  if (isMatchingAll(targetMethod)) {
    return pathItem
  }

  const methodPattern = new RegExp(targetMethod)

  return Object.fromEntries(
    Object.entries(pathItem).filter(([method]) => {
      return (
        method.toLowerCase() === targetMethod.toLowerCase() ||
        methodPattern.test(method)
      )
    })
  )
}
