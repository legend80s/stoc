// @ts-check
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { generateTSFromFile } from '../lib/generate.mjs';

/**
 * @typedef {Object} IOptions
 * @property {string} input file path to swagger json
 * @property {string} api only generate typings match the api path, default *
 * @property {string} method only generate typings match the method, default *
 * @property {boolean} [debug] debug mode
 * @property {boolean} [typesOnly] only output types
 * }
 */

/**
 * @param {IOptions} options
 * @returns {Promise<void>}
 */
export async function swaggerToTS(options) {
  const { input, api, method, debug = false, typesOnly = false } = options;

  const filepath = pathToFileURL(path.join(process.cwd(), input));

  const result = await generateTSFromFile(filepath, {
    typesOnly,
    filter: {
      api,
      method,
    },
  });

  prettyPrint(result, { debug, typesOnly });
}

/**
 *
 * @param {Awaited<ReturnType<typeof generateTSFromFile>>} result
 * @param {Pick<IOptions, 'debug' | 'typesOnly'>} opts
 */
export async function prettyPrint(result, { debug, typesOnly }) {
  const { list, total } = result;
  const printSummary = () =>
    debug &&
    console.log(`${list.length}/${total}`, 'API generated successfully');

  if (!typesOnly) {
    printCode(
      // @ts-expect-error code must exist when typesOnly is false
      list.map((item) => item.code),
      { debug }
    );
  }

  printTypes(list, { debug });

  printSummary();
}

/**
 * @param {string[]} codes
 * @param {{ debug: boolean }} options
 * @returns {void}
 */
function printCode(codes, { debug }) {
  for (let index = 0; index < codes.length; index++) {
    const code = codes[index];
    debug &&
      console.log(
        `// #${index + 1}`
        // `BEGIN --------------------------------------------`
      );
    console.log('export', code);
    console.log();
    // debug &&
    //   console.log(
    //     `#${index + 1} END --------------------------------------------`
    //   );
  }
}

/**
 *
 * @param {import('../lib/generate.mjs').IGeneratedItem[]} result
 * @param {Pick<IOptions, 'debug'>} opts
 */
function printTypes(result, { debug }) {
  const unique = new Set();
  const types = [];
  for (let i = 0; i < result.length; i++) {
    const {
      method,
      path,
      requestBodyType,
      requestParametersType,
      responseType,
    } = result[i];
    debug &&
      console.log(
        `// #${i + 1}`
        // 'BEGIN --------------------------------------------'
      );
    if (debug) {
      console.log(method, path);
      console.log();
    }

    if (requestParametersType && !unique.has(requestParametersType)) {
      unique.add(requestParametersType);
      types.push(requestParametersType);
    }

    if (requestBodyType && !unique.has(requestBodyType)) {
      unique.add(requestBodyType);
      types.push(requestBodyType);
    }

    if (responseType && !unique.has(responseType)) {
      unique.add(responseType);
      types.push(responseType);
    }

    // debug &&
    //   console.log(
    //     '#' + (i + 1),
    //     'END ---------------------------------------------'
    //   );
  }

  console.log(types.map((type) => type.trim()).join('\n\n'));
}

/**
 * @typedef {import('../lib/generate.mjs').IGeneratedItemOnlyTypes} IGeneratedItem
 */

/** @typedef {IGeneratedItem & { code: string }} IGenerated */
