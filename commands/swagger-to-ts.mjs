import { codeToANSI } from '@shikijs/cli'
import { readJSONFile } from '../lib/fs.mjs'
import { generateTSFromSchema } from '../lib/generate.mjs'
import {
  findMaxPrefixSubstring,
  groupBy,
  interfaceToType,
  isVariableName,
  prefixSpacesToEveryNewLine,
  verbToNoun,
} from '../lib/lite-lodash.mjs'

/** @import { IOpenAPISchema } from '../lib/typing' */

/**
 * @typedef {Object} IOptions
 * @property {string} input file path to swagger json
 * @property {string} [api] only generate typings match the api path, default *
 * @property {'get' | 'post' | 'delete' | 'head' | 'put' | 'patch' | '*'} [method] only generate typings match the method, default *
 * @property {boolean} [debug] debug mode
 * @property {boolean} [typesOnly] only output types
 * @property {boolean} [functionOnly] only output functions
 * @property {boolean} [grouped] should `prettyPrint` output grouped by api, default `false`
 * @property {boolean} [useInterface] Output `interface` instead of `type`, default `false`
 * @property {boolean} [request] should generate request.ts, default `true`
 * }
 */

/**
 * @param {IOptions} options
 * @returns {Promise<void>}
 */
export async function swaggerToTS(options) {
  const {
    input,
    api,
    method,
    debug = false,
    typesOnly = false,
    functionOnly = false,
    grouped = true,
    useInterface = false,
    request = true,
  } = options
  if (debug) {
    console.log('[debug] options:', options)
  }

  const filepath = input

  if (debug) {
    console.log('filepath:', filepath)
  }

  const filter = {
    api,
    method,
  }

  // Import the JSON schema from the specified file
  /** @type {ICommonOpenAPISchema} */
  const jsonSchema = await readJSONFile(filepath.toString())

  const result = await generateTSFromSchema(jsonSchema, {
    debug,
    typesOnly,
    functionWithExport: false,
    request,
    filter,
  })

  prettyPrint(result, {
    debug,
    typesOnly,
    functionOnly,
    grouped,
    useInterface,
    filter,
    jsonSchema,
  })
}

/**
 *
 * @param {Awaited<ReturnType<typeof generateTSFromSchema>>} result
 * @param {Pick<IOptions, 'debug' | 'typesOnly' | 'grouped' | 'functionOnly' | 'useInterface'> & { filter: import('../lib/typing.js').IFilter; jsonSchema: ICommonOpenAPISchema }} options
 */
export async function prettyPrint(
  result,
  {
    debug,
    typesOnly,
    grouped,
    functionOnly,
    useInterface,
    filter,
    jsonSchema,
  } = {
    filter: {},
    // @ts-expect-error
    jsonSchema: {},
  }
) {
  const { list, total, codeBefore } = result
  const printSummary = () => {
    // Print verbose summary for debug on no result.
    if (!!list.length || !total) {
      console.log('filter:', filter)
      console.log('result:', result)
      console.log('jsonSchema:', jsonSchema)
    }

    if (debug || !list.length || !total) {
      console.log(list.length, '/', total, 'API generated.')
    }
  }

  if (!typesOnly) {
    codeBefore && (await printCode([codeBefore], { debug }))

    if (grouped) {
      await printByGroup(list)
    } else {
      await printCode(
        // @ts-expect-error code must exist when typesOnly is false
        list.map((item) => item.code),
        { debug }
      )
    }
  }

  if (functionOnly) {
    // functions has been printed above
  } else {
    await printTypes(list, { debug, useInterface })
  }

  printSummary()
}

/**
 * @param {string} longestPrefix
 */
const toServiceName = (longestPrefix) => {
  const path = longestPrefix.split('/').at(-1)

  // console.assert(path, 'findMaxPrefixSubstring is empty', paths);
  if (!path) {
    return ''
  }

  return verbToNoun(path[0].toUpperCase() + path.slice(1))
}

/**
 * @param {IGeneratedItem[]} list
 */
async function printByGroup(list) {
  const groups = groupBy(list, (item) => item.group)
  // console.log('groups:', groups)

  /** @type {string[]} */
  const codeGroups = []
  Object.entries(groups).forEach(([groupLabel, items], idx) => {
    const paths = items.map((item) => item.path)
    const longestPrefix = findMaxPrefixSubstring(paths).replace(/\/$/, '')

    /** @type {string} */
    const serviceName = isVariableName(groupLabel)
      ? groupLabel
      : toServiceName(longestPrefix)
    // console.log('groupLabel:', { groupLabel, longestPrefix, serviceName })

    const commonApiPrefix = longestPrefix
      ? `  prefix: '${longestPrefix}',\n`
      : ''

    const funcs = items.map((item) =>
      prefixSpacesToEveryNewLine(
        item.code
          .replace(' function ', ' ')
          .replace(
            longestPrefix ? longestPrefix : '__MAGIC_WONT_REPLACE__',
            '${this.prefix}'
          )
          // '${this.prefix}/list' => `${this.prefix}/list`
          .replace(/'(\$.+?)'/, '`$1`')
      )
    )
    // async foo() {
    // return request(`xxx/fdsfdsf`, ...)
    // }
    const prefix = `/** ${groupLabel} */\nexport const ${serviceName}Service${serviceName ? '' : idx === 0 ? '' : idx} = {`
    const suffix = '};'

    codeGroups.push(
      [prefix, commonApiPrefix, funcs.join(',\n\n'), suffix]
        // commonApiPrefix maybe be empty should filter it
        .filter(Boolean)
        .join('\n')
    )
  })

  console.log(await highlight(codeGroups.join('\n\n')))
}

/**
 * @param {string[]} codes
 * @param {{ debug?: boolean }} options
 * @returns {Promise<void>}
 */
async function printCode(codes, { debug }) {
  // console.log('printCode:');
  for (let index = 0; index < codes.length; index++) {
    const code = codes[index]
    debug &&
      console.log(
        `// #${index + 1}`
        // `BEGIN --------------------------------------------`
      )
    console.log(await highlight(code))
    // debug &&
    //   console.log(
    //     `#${index + 1} END --------------------------------------------`
    //   );
  }
}

/**
 *
 * @param {import('../lib/generate.mjs').IGeneratedItem[]} result
 * @param {Pick<IOptions, 'debug' | 'useInterface'>} opts
 */
async function printTypes(result, { debug, useInterface }) {
  const unique = new Set()
  const types = []
  let genericResp = ''

  for (let i = 0; i < result.length; i++) {
    const {
      method,
      path,
      requestBodyType,
      requestParametersType,
      responseType,
      genericResp: genericType,
    } = result[i]

    if (!genericResp) {
      genericResp = genericType
    }

    debug &&
      console.log(
        `// #${i + 1}`
        // 'BEGIN --------------------------------------------'
      )
    if (debug) {
      console.log(method, path)
      console.log()
    }

    if (requestParametersType && !unique.has(requestParametersType)) {
      unique.add(requestParametersType)
      types.push(requestParametersType)
    }

    if (requestBodyType && !unique.has(requestBodyType)) {
      unique.add(requestBodyType)
      types.push(requestBodyType)
    }

    if (responseType && !unique.has(responseType)) {
      unique.add(responseType)
      types.push(responseType.replace('__Resp__', ''))
    }

    // debug &&
    //   console.log(
    //     '#' + (i + 1),
    //     'END ---------------------------------------------'
    //   );
  }

  let content = [genericResp]
    .filter(Boolean)
    .concat(types)
    .map((type) => type.trim())
    .join('\n\n')

  if (!useInterface) {
    content = interfaceToType(content)
  }

  content && console.log(await highlight(content))
}

/**
 *
 * @param {string} content
 * @returns {Promise<string>}
 */
async function highlight(content) {
  return await codeToANSI(content, 'typescript', 'dark-plus')
}

/**
 * @typedef {import('../lib/generate.mjs').IGeneratedItemOnlyTypes} IGeneratedItem
 */

/** @typedef {IGeneratedItem & { code: string }} IGenerated */
