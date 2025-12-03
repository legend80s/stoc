import { deepStrictEqual } from 'node:assert'
import { execSync } from 'node:child_process'
import { it } from 'node:test'
import { stripVTControlCharacters } from 'node:util'

it('should generate camelCased method name', () => {
  const input = `node bin.mjs -i assets/swagger-light-model.json -g --api=lightModel`
  const actual = stripVTControlCharacters(execSync(input).toString('utf8'))
  const expected = `/** app */
export const appService = {
  prefix: '/api/lm/lightModel/create',

  /**
   * 创建小模型
   */
  async createLightModel(data: ICreateLightModelReqData): Promise<Data<ICreateLightModelRespData>> {
    return request<Data<ICreateLightModelRespData>>(\`\${this.prefix}\`, {
      method: 'POST',
      data,
    });
  }
};

type Data<T> = {
  code?: number;
  data?: T;
  errorArgs?: {
    [k: string]: unknown;
  };
  errorMsg?: string;
  success?: boolean;
}

type ICreateLightModelReqData = {
  envList?: {
    key?: string;
    value?: string;
  }[];
  modelId?: number;
  /**
   * 推理服务名称,不是k8s内的名称
   * 长度 **[2, 20]**
   */
  name: string;
  /**
   * 需要的副本数量
   * 范围 **[0, +∞]**
   */
  replicas: number;
  resource?: {
    /**
     * cpu数 core
     */
    cpu?: number;
  };
}

type ICreateLightModelRespData = {
  [k: string]: unknown;
}

`

  deepStrictEqual(actual, expected)
})
