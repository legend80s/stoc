interface ICommonOpenAPISchema {
  openapi?: string;
  info?: Info;
  servers?: Server[];
  paths: Paths;
  components: Components;
}

interface Components {
  schemas: Schemas;
}

type Schemas = Record<string, JSONSchema>;

interface JSONSchema {
  type: string;
  properties: Properties;
  [x: string]: any;
}

type Properties = Record<string, any>;

type Paths = Record<string, Path>;

interface Path {
  get?: Get;
  post?: Get;
  delete?: Get;
  put?: Get;
  patch?: Get;
  head?: Get;
}

interface Get {
  tags?: string[];
  summary: string;
  description?: string;
  operationId: string;
  parameters?: Parameter[];
  requestBody?: Record<string, any>;
  responses?: Record<string, any>;
}

interface Parameter {
  name: string;
  in: string;
  required: boolean;
  schema: Schema;
}

interface Schema {
  $ref: string;
}

interface Server {
  url: string;
  description: string;
}

interface Info {
  title: string;
  version: string;
}
