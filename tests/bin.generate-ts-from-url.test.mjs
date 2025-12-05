import { deepStrictEqual } from 'node:assert'
import { execSync } from 'node:child_process'
import { it } from 'node:test'
import { stripVTControlCharacters } from 'node:util'

it('should work when input is a remote url', () => {
  const input = `node bin.mjs -i https://petstore3.swagger.io/api/v3/openapi.json --api pet -m put`

  let actual = ''
  try {
    // console.time('fetch')
    actual = stripVTControlCharacters(
      execSync(input, { timeout: 4000 }).toString('utf8')
    )
    // console.timeEnd('fetch') // 1.908s
  } catch (error) {
    // if is timeout error
    // @ts-expect-error
    if (error.code === 'ETIMEDOUT') {
      // 超时认为成功
      console.info('接口超时不应该导致测试失败')
      return
    } else {
      throw error
    }
  }

  // console.log('actual:|', actual, '|')

  const expected = `/** pet */
export const petService = {
  prefix: '/api/v3/pet',

  /**
   * Update an existing pet.
   */
  async updatePet(data: IUpdatePetReqData): Promise<IUpdatePetRespData> {
    return request<IUpdatePetRespData>(\`$\{petService.prefix}\`, {
      method: 'PUT',
      data,
    });
  }
};

type IUpdatePetReqData = {
  id?: number;
  name: string;
  category?: {
    id?: number;
    name?: string;
  };
  photoUrls: string[];
  tags?: {
    id?: number;
    name?: string;
  }[];
  /**
   * pet status in the store
   */
  status?: "available" | "pending" | "sold";
}

type IUpdatePetRespData = {
  id?: number;
  name: string;
  category?: {
    id?: number;
    name?: string;
  };
  photoUrls: string[];
  tags?: {
    id?: number;
    name?: string;
  }[];
  /**
   * pet status in the store
   */
  status?: "available" | "pending" | "sold";
}

`

  deepStrictEqual(actual, expected)
})
