import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 *
 * @param {string} input
 * @returns
 */
export async function readJSONFile(input) {
  // console.log('filepath:', input);

  try {
    const filepath = pathToFileURL(
      path.isAbsolute(input) ? input : path.join(process.cwd(), input)
    );

    return (
      await import(filepath.toString(), {
        with: { type: 'json' },
      })
    ).default;
  } catch (error) {
    // console.error('fallback to fs readFile');

    return JSON.parse(await fs.readFile(input, 'utf8'));
  }
}
