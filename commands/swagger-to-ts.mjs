import { codeToANSI } from '@shikijs/cli'
import { readJSONFile, readJSONFromURL } from '../lib/fs.mjs'
import { generateTSFromSchema } from '../lib/generate.mjs'
import {
  findMaxPrefixSubstring,
  groupBy,
  interfaceToType,
  isVariableName,
  prefixSpacesToEveryNewLine,
  toServiceName,
} from '../lib/lite-lodash.mjs'
import { logger } from '../lib/logger.mjs'
import { parsed } from '../lib/args.mjs'

/** @import {IOptions} from '../lib/typing' */
/** @import {ICommonOpenAPISchema} from '../index' */

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
    returnType = false,
    grouped = true,
    useInterface = false,
    request = false,
  } = options
  logger.log('options:', options)

  const filepath = input

  logger.log('filepath:', filepath)

  const filter = {
    api,
    method,
  }

  // Import the JSON schema from the specified file
  /** @type {ICommonOpenAPISchema} */

  const jsonSchema = /https?/.test(filepath)
    ? await readJSONFromURL(filepath)
    : await readJSONFile(filepath.toString())

  const result = await generateTSFromSchema(jsonSchema, {
    debug,
    typesOnly,
    functionWithExport: !grouped,
    request,
    filter,
    explicitReturnTypeAttached: returnType,
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
    if (!list.length || !total) {
      console.warn('filter:', filter)
      console.warn('result:', result)
      console.warn('jsonSchema:', jsonSchema)
    }

    if (debug || !list.length || !total) {
      console.warn(list.length, '/', total, 'API generated.')
    }
  }

  const header = parsed.header

  if (!typesOnly) {
    codeBefore &&
      (await printCode(prefixHeader(header, [codeBefore]), {
        debug,
      }))

    if (grouped) {
      await printByGroup(header, list)
    } else {
      await printCode(
        prefixHeader(
          header,
          // @ts-expect-error code must exist when typesOnly is false
          list.map((item) => item.code)
        ),
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
 * Add header to code if provided
 *
 * @param {string | undefined} header
 * @param {string[]} codes
 * @returns {string[]}
 */
function prefixHeader(header, codes) {
  return header ? [`${header}\n`].concat(codes) : codes
}

/**
 * @param {string | undefined} header
 * @param {IGeneratedItem[]} list
 */
async function printByGroup(header, list) {
  const groups = groupBy(list, (item) => item.group)
  // console.log('groups:', groups)

  /** @type {string[]} */
  const codeGroups = []
  Object.entries(groups).forEach(([groupLabel, items], idx) => {
    const paths = items.map((item) => item.path)
    // console.error('paths:', paths)
    // console.error('paths:', paths)

    const longestPrefix = findMaxPrefixSubstring(paths).replace(/\/$/, '')

    /** @type {string} */
    const serviceName = isVariableName(groupLabel)
      ? groupLabel
      : toServiceName(longestPrefix)
    // console.error('groupLabel:', { groupLabel, longestPrefix, serviceName })

    const commonApiPrefix = longestPrefix
      ? `  prefix: '${longestPrefix}',\n`
      : ''

    const funcs = items.map((item) =>
      prefixSpacesToEveryNewLine(
        // @ts-expect-error
        item.code
          .replace(' function ', ' ')
          .replace(
            longestPrefix ? longestPrefix : '__MAGIC_WONT_REPLACE__',
            `\${${serviceName}Service.prefix}`
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

  console.log(
    await highlight((header ? `${header}\n\n` : '') + codeGroups.join('\n\n'))
  )
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
  let types = []
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
      types.push(responseType)
    }

    // debug &&
    //   console.log(
    //     '#' + (i + 1),
    //     'END ---------------------------------------------'
    //   );
  }

  types = types
    .map((type) => type.replaceAll('__Resp__', ''))
    // 一个 type 可能包含多个 interface，所以需要拆分
    .flatMap((type) => type.split(/(?=interface\s+\w+)/g))

  const uniqTypes = Array.from(new Set(types))

  // console.error('types:', types.length)
  // console.error('uniq types:', uniqTypes.length)
  // console.error('uniqTypes:', uniqTypes)

  let content = [genericResp]
    .filter(Boolean)
    .concat(uniqTypes)
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
