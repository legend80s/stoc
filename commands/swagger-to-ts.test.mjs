import { it } from 'node:test'
import { swaggerToTS } from './swagger-to-ts.mjs'

it('#smoke-test grouped false', async () => {
  await swaggerToTS({
    input: `./assets/openapi-3.0.1.json`,
    api: 'foo',
    grouped: false,
    debug: true,
  })
})

it('#smoke-test grouped true', async () => {
  await swaggerToTS({
    input: `./assets/openapi-3.0.1.json`,
    api: 'foo',
    grouped: true,
  })
})
