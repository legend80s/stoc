// @ts-check
import { generateTSFromFile } from './lib/generate.mjs';

// main();

async function main() {
  return generateTSFromFile('./assets/openapi-apiserver.json');
}
