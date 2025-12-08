import { deepStrictEqual, match } from 'node:assert'
import { execSync } from 'node:child_process'
import { it } from 'node:test'
import { stripVTControlCharacters } from 'node:util'

it('should work when debugging', () => {
  const input = `node bin.mjs -i assets/petstore3-v3-openapi.json --api "pet" -m "put" --debug`

  const actual = stripVTControlCharacters(execSync(input).toString('utf8'))

  deepStrictEqual(actual.includes('1 / 1 API generated.'), false)
  deepStrictEqual(actual.includes('[LOG]'), true)
  deepStrictEqual(actual.includes('[WARN]'), false)
  // expect mach swaggerToTS: 165.274ms or 165ms
  match(actual, /.*swaggerToTS: (\d+\.)?\d+ms.*/)
})
