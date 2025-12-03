import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 *
 * @param {string} input
 * @returns
 */
export async function readJSONFile(input) {
  // console.log('filepath:', input);
  // return JSON.parse(await fs.readFile(input, 'utf8'));

  try {
    const filepath = pathToFileURL(
      path.isAbsolute(input) ? input : path.join(process.cwd(), input)
    )

    return (
      await import(filepath.toString(), {
        with: { type: 'json' },
      })
    ).default
  } catch (error) {
    // console.error('fallback to fs readFile');

    return JSON.parse(await fs.readFile(input, 'utf8'))
  }
}

/**
 *
 * @param {string} url
 * @returns {Promise<unknown>}
 * @example
 * await readJSONFromURL('https://unoapi.codingmo.com/api/dd-openapi-v31.json')
 */
export async function readJSONFromURL(url) {
  const resp = await fetch(url)
  const json = await resp.json()

  return json
}
