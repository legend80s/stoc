import { deepStrictEqual } from 'node:assert'
import { execSync } from 'node:child_process'
import { it } from 'node:test'
import { stripVTControlCharacters } from 'node:util'

it('should work when method is a regexp', () => {
  const input = `node bin.mjs -i assets/petstore3-v3-openapi.json --api "pet" -m "put|post"`

  const actual = stripVTControlCharacters(execSync(input).toString('utf8'))

  const expected = `/** pet */
export const petService = {
  prefix: '/api/v3/pet',

  /**
   * Update an existing pet.
   */
  async updatePet(data: IUpdatePetRequestData): Promise<IUpdatePetResponseData> {
    return request<IUpdatePetResponseData>(\`\${petService.prefix}\`, {
      method: 'PUT',
      data,
    });
  },

  /**
   * Add a new pet to the store.
   */
  async addPet(data: IAddPetRequestData): Promise<IUpdatePetResponseData> {
    return request<IUpdatePetResponseData>(\`\${petService.prefix}\`, {
      method: 'POST',
      data,
    });
  },

  /**
   * Updates a pet in the store with form data.
   */
  async updatePetWithForm(params: IUpdatePetWithFormParams): Promise<IUpdatePetResponseData> {
    return request<IUpdatePetResponseData>(\`\${petService.prefix}/$\{params.petId}\`, {
      method: 'POST',
      params,
    });
  },

  /**
   * Uploads an image.
   */
  async uploadFile(params: IUploadFileParams): Promise<IUploadFileResponseData> {
    return request<IUploadFileResponseData>(\`\${petService.prefix}/$\{params.petId}/uploadImage\`, {
      method: 'POST',
      params,
    });
  }
};

type IUpdatePetRequestData = {
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

type IUpdatePetResponseData = {
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

type IAddPetRequestData = {
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

type IUpdatePetWithFormParams = {
  /**
   * ID of pet that needs to be updated
   */
  petId: number;
  /**
   * Name of pet that needs to be updated
   */
  name?: string;
  /**
   * Status of pet that needs to be updated
   */
  status?: string;
}

type IUploadFileParams = {
  /**
   * ID of pet to update
   */
  petId: number;
  /**
   * Additional Metadata
   */
  additionalMetadata?: string;
}

type IUploadFileResponseData = {
  code?: number;
  type?: string;
  message?: string;
}

`
  deepStrictEqual(actual, expected)
})
