import { deepStrictEqual } from 'node:assert'
import { execSync } from 'node:child_process'
import { it } from 'node:test'
import { stripVTControlCharacters } from 'node:util'

it('should work when using the v2 API', () => {
  const input = `node bin.mjs -i assets/petstore-v2-openapi.json --api pet -m put --header="import request from '@/utils/request';"`

  const actual = stripVTControlCharacters(execSync(input).toString('utf8'))

  const expected = `import request from '@/utils/request';

/** pet */
export const petService = {
  prefix: '/v2/pet' as const,

  /**
   * Update an existing pet
   */
  async updatePet(data: IUpdatePetRequestData): Promise<IUpdatePetResponseData> {
    return request<IUpdatePetResponseData>(\`$\{petService.prefix}\`, {
      method: 'PUT',
      data,
    });
  }
};

type IUpdatePetRequestData = {
  id?: number;
  category?: {
    id?: number;
    name?: string;
  };
  name: string;
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

type IUpdatePetResponseData = {
  [k: string]: unknown;
}

`
  deepStrictEqual(actual, expected)
})
