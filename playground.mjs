import { prettyPrint, generateTSFromFile } from './index.mjs';

const result = await generateTSFromFile(
  '../assets/openapi-apiserver-simple.json',
  {
    typesOnly: false,
    interfacePrefix: 'I',
    filter: {
      api: '*',
      method: '*',
    },
  }
);

// console.log('result:', result);

prettyPrint(result, { debug: false, typesOnly: false });
