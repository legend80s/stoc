// import { prettyPrint, generateTSFromFile } from './index.mjs';

// const result = await generateTSFromFile(
//   '../assets/openapi-apiserver-simple.json',
//   {
//     typesOnly: false,
//     interfacePrefix: 'I',
//     filter: {
//       api: '*',
//       method: '*',
//     },
//   }
// );

// // console.log('result:', result);

// await prettyPrint(result, { debug: false, typesOnly: false });

// --------------------------
// import { compile } from 'json-schema-to-typescript';
import { genGenericRespType } from './lib/lite-lodash.mjs';
const properties = {
  total: {
    type: 'integer',
    format: 'int64',
  },
  pageSize: {
    type: 'integer',
    format: 'int32',
  },
  current: {
    type: 'integer',
    format: 'int32',
  },
};

const schema = {
  title: '',

  type: 'object',
  properties: {
    code: { type: 'integer', format: 'int32', title: '' },
    data: { type: 'object', properties, title: 'listFooRespData' },
    errorMsg: { type: 'string', title: '' },
    success: { type: 'boolean', title: '' },
  },
};
// export interface ExampleSchema {
//   code?: number;
//   data?: ListFooRespData;
//   errorMsg?: string;
//   success?: boolean;
// }

const type = genGenericRespType(schema);
console.log('type:', type);
// --------------------------

// import { prettyPrint, generateTSFromSchema } from './index.mjs';

// const result = await generateTSFromSchema({
//   openapi: '3.0.1',
//   info: {
//     title: 'OpenAPI definition',
//     version: 'v0',
//   },
//   servers: [
//     {
//       url: 'http://127.0.0.1:8000',
//       description: 'Generated server url',
//     },
//   ],
//   paths: {
//     '/api/bar/v1/baz/foo/list': {
//       get: {
//         tags: ['foo的相关接口'],
//         summary: '分页查询foo作业',
//         description: '分页查询foo作业',
//         operationId: 'listFoo',
//         parameters: [
//           {
//             name: 'req',
//             in: 'query',
//             required: true,
//             schema: {
//               $ref: '#/components/schemas/PageRequest',
//             },
//           },
//         ],
//         responses: {
//           200: {
//             description: '服务Okay，但请求是否成功请看返回体里面的code',
//             content: {
//               '*/*': {
//                 schema: {
//                   $ref: '#/components/schemas/ResponsePageVOEvaluateFooResp',
//                 },
//               },
//             },
//           },
//         },
//       },
//     },
//   },
//   components: {
//     schemas: {
//       PageRequest: {
//         required: ['current', 'pageSize'],
//         type: 'object',
//         properties: {
//           current: {
//             minimum: 1,
//             type: 'integer',
//             description: 'current',
//             format: 'int32',
//           },
//           pageSize: {
//             maximum: 1000,
//             type: 'integer',
//             description: 'pageSize',
//             format: 'int32',
//           },
//         },
//       },
//       EvaluateFooResp: {
//         type: 'object',
//         properties: {
//           id: {
//             type: 'integer',
//             format: 'int64',
//           },
//           name: {
//             type: 'string',
//           },
//           description: {
//             type: 'string',
//           },
//           status: {
//             type: 'string',
//             enum: ['XX', 'YY', 'COMPLETED', 'FAILED'],
//           },
//           bars: {
//             type: 'array',
//             items: {
//               type: 'string',
//             },
//           },
//         },
//       },
//       PageVOEvaluateFooResp: {
//         type: 'object',
//         properties: {
//           total: {
//             type: 'integer',
//             format: 'int64',
//           },
//           pageSize: {
//             type: 'integer',
//             format: 'int32',
//           },
//           current: {
//             type: 'integer',
//             format: 'int32',
//           },
//           list: {
//             type: 'array',
//             items: {
//               $ref: '#/components/schemas/EvaluateFooResp',
//             },
//           },
//         },
//       },
//       ResponsePageVOEvaluateFooResp: {
//         type: 'object',
//         properties: {
//           code: {
//             type: 'integer',
//             format: 'int32',
//           },
//           data: {
//             $ref: '#/components/schemas/PageVOEvaluateFooResp',
//           },
//           errorMsg: {
//             type: 'string',
//           },
//           success: {
//             type: 'boolean',
//           },
//         },
//       },
//     },
//   },
// });

// await prettyPrint(result);
