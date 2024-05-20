import assert from 'node:assert';
import { it } from 'node:test';
import { removePropertyTitle } from '../lib/remove-title.mjs';

it('only remove title under properties directly', () => {
  const schema = {
    properties: {
      code: {
        type: 'integer',
        title: 'hello world',
      },
      message: {
        anyOf: [
          {
            type: 'string',
          },
          {
            type: 'null',
          },
        ],
        title: 'xxxmessage',
      },
      data: {
        anyOf: [
          {
            properties: {
              bar_id: {
                type: 'integer',
                title: 'Bar Id 1',
                description: 'bar id，必定存在',
              },
              bar: {
                type: 'string',
                title: 'Bar 2',
                description: 'bar，必定存在',
              },
            },
            type: 'object',
            required: ['bar_id', 'bar'],
            title: 'CreateBarResponse',
          },
          {
            type: 'null',
          },
        ],
        title: 'yyyy',
      },
    },
    type: 'object',
    required: ['code'],
    title: 'BaseResponse[CreateBarResponse]',
  };

  const actual = removePropertyTitle(schema);
  const expected = {
    properties: {
      code: {
        type: 'integer',
        title: '',
      },
      message: {
        anyOf: [
          {
            type: 'string',
          },
          {
            type: 'null',
          },
        ],
        title: '',
      },
      data: {
        anyOf: [
          {
            properties: {
              bar_id: {
                type: 'integer',
                title: '',
                description: 'bar id，必定存在',
              },
              bar: {
                type: 'string',
                title: '',
                description: 'bar，必定存在',
              },
            },
            type: 'object',
            required: ['bar_id', 'bar'],
            title: 'CreateBarResponse',
          },
          {
            type: 'null',
          },
        ],
        title: '',
      },
    },
    type: 'object',
    required: ['code'],
    title: 'BaseResponse[CreateBarResponse]',
  };

  assert.deepStrictEqual(actual, expected);
});
