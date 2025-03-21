// import $RefParser from '@apidevtools/json-schema-ref-parser';
import traverse from 'json-schema-traverse';

export function removePropertyTitle(schema) {
  traverse(schema, {
    allKeys: true,

    cb: (...args) => {
      // console.log(args);
      // /properties/code
      // '/properties/data/anyOf/0/properties/api_key_id',
      // '/properties/data/anyOf/0/properties/api_key',
      const [prop, path] = args;
      if (/\/properties\/[^/]+$/.test(path)) {
        // console.log(path, '=>', prop);
        // console.log('---------------------------');

        prop.title = '';
      }
    },
  });

  return schema;
}

// run();
// async function run() {
//   console.time('costs');
//   const jsonSchema = (
//     await import('../assets/openapi-apiserver-simple.json', {
//       with: { type: 'json' },
//     })
//   ).default;

//   await $RefParser.dereference(jsonSchema);

//   // console.log('jsonSchema1:', jsonSchema);
//   removePropertyTitle(jsonSchema);
//   // console.log('jsonSchema2:', jsonSchema);
// }
