import { deepStrictEqual } from 'node:assert'
import { describe, it } from 'node:test'
import { filterSchema } from './schema.mjs'

describe('filterSchema', () => {
  it('should filter schema by api and method', () => {
    const schema = {
      paths: {
        '/pet': {
          put: {
            tags: ['Array'],
            summary: 'Update an existing pet.',
            description: 'Update an existing pet by Id.',
            operationId: 'updatePet',
            requestBody: [Object],
            responses: [Object],
            security: [Array],
          },
          post: {
            tags: ['Array'],
            summary: 'Add a new pet to the store.',
            description: 'Add a new pet to the store.',
            operationId: 'addPet',
            requestBody: [Object],
            responses: [Object],
            security: [Array],
          },
        },
        '/pet/findByStatus': {
          get: {
            tags: ['Array'],
            summary: 'Finds Pets by status.',
            description:
              'Multiple status values can be provided with comma separated strings.',
            operationId: 'findPetsByStatus',
            parameters: [Array],
            responses: [Object],
            security: [Array],
          },
        },
      },
    }

    const actual = filterSchema(
      // @ts-expect-error
      schema,
      { api: 'pet', method: 'put|post' }
    )

    console.log('actual:', actual)

    const expected = {
      paths: {
        '/pet': {
          put: schema.paths['/pet'].put,
          post: schema.paths['/pet'].post,
        },
      },
    }

    deepStrictEqual(actual, expected)
  })
})
