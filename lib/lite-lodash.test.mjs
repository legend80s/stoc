import assert from 'node:assert';
import { describe, it } from 'node:test';
import { interfaceToType } from './lite-lodash.mjs';

describe('interfaceToType', () => {
  it('should convert an one-line interface to a type', () => {
    const input =
      'interface IFoo { code: number; message: string | null; data?: IPagedQueryBarsRespData | null; }';
    const actual = interfaceToType(input);
    const expected =
      'type IFoo = { code: number; message: string | null; data?: IPagedQueryBarsRespData | null; }';

    assert.deepStrictEqual(actual, expected);
  });

  it('should convert an interface to a type', () => {
    const input = `interface IFoo {
  code: number;
  message: string | null;
  data?: IPagedQueryBarsRespData | null;
}`;
    const actual = interfaceToType(input);
    const expected = `type IFoo = {
  code: number;
  message: string | null;
  data?: IPagedQueryBarsRespData | null;
}`;

    assert.deepStrictEqual(actual, expected);
  });

  it('should convert multiple interfaces to types', () => {
    const input = `interface bar {
  name: string;
  age: number;
}

interface IFoo {
  code: number;
  message: string | null;
  data?: IPagedQueryBarsRespData | null;
}`;
    const actual = interfaceToType(input);
    const expected = `type bar = {
  name: string;
  age: number;
}

type IFoo = {
  code: number;
  message: string | null;
  data?: IPagedQueryBarsRespData | null;
}`;

    assert.deepStrictEqual(actual, expected);
  });

  it('should convert extends interface to & type', () => {
    const input = `
interface IBar { code: number; message: string | null; }
interface IFoo extends IBar { data?: IPagedQueryBarsRespData | null; }
`;
    const actual = interfaceToType(input);
    const expected = `
type IBar = { code: number; message: string | null; }
type IFoo = IBar & { data?: IPagedQueryBarsRespData | null; }
`;

    assert.deepStrictEqual(actual, expected);
  });
});
