import helper from 'node-red-node-test-helper';

import {
  checkMaxBytesString,
  createAWSClientOptions,
  flattenResultItemList,
  getValueByPath,
  isNonEmptyString,
} from '../../src/lib/util';

import AWSConfigNode, { IAWSConfigNode } from '../../src/nodes/aws-config';

helper.init(require.resolve('node-red'));

describe('util', () => {
  describe('createAWSClientOptions', () => {
    const testCredentials = {
      n1: {
        accessKeyId: 'myAccessKeyId',
        secretAccessKey: 'mySecretAccesKey',
      },
    };

    it('should create AWS client options', async () => {
      const flow = [{ id: 'n1', type: 'aws-config', name: 'AWS Config', authType: 'CREDENTIALS', region: 'myRegion' }];
      await helper.load(AWSConfigNode, flow, testCredentials);
      const n1 = helper.getNode('n1') as IAWSConfigNode;

      expect(createAWSClientOptions(n1)).toEqual({
        region: 'myRegion',
        credentials: {
          accessKeyId: 'myAccessKeyId',
          secretAccessKey: 'mySecretAccesKey',
        },
      });
    });
  });

  describe('getValueByPath', () => {
    const testObject = {
      num: 123,
      str: 'hello',
      bool: true,
      nothing: null,
      defined: undefined,
      nested: {
        num: 987,
        str: 'world',
        bool: false,
        nothing: null,
        defined: undefined,
        furtherNested: {
          num: 42,
          str: 'foo',
          bool: true,
          nothing: null,
          defined: undefined,
        },
      },
    };

    it.each([
      { path: 'num', expected: 123 },
      { path: 'str', expected: 'hello' },
      { path: 'bool', expected: true },
      { path: 'nothing', expected: null },
      { path: 'defined', expected: undefined },
      { path: 'notDefined', expected: undefined },
      { path: 'nested.num', expected: 987 },
      { path: 'nested.str', expected: 'world' },
      { path: 'nested.bool', expected: false },
      { path: 'nested.nothing', expected: null },
      { path: 'nested.defined', expected: undefined },
      { path: 'nested.notDefined', expected: undefined },
      { path: 'nested.furtherNested.num', expected: 42 },
      { path: 'nested.furtherNested.str', expected: 'foo' },
      { path: 'nested.furtherNested.bool', expected: true },
      { path: 'nested.furtherNested.nothing', expected: null },
      { path: 'nested.furtherNested.defined', expected: undefined },
      { path: 'nested.furtherNested.notDefined', expected: undefined },
    ])('should get value by path ($path)', ({ path, expected }) => {
      expect(getValueByPath(path, testObject)).toEqual(expected);
    });
  });

  describe('isNonEmptyString', () => {
    it.each([
      { input: 'hello world', expected: true },
      { input: '', expected: false },
      { input: ' ', expected: false },
      { input: 123, expected: false },
      { input: true, expected: false },
      { input: {}, expected: false },
      { input: [], expected: false },
      { input: null, expected: false },
      { input: undefined, expected: false },
      { input: (): void => {}, expected: false },
    ])('should return true if it an non empty string: $expected (input: $input)', ({ input, expected }) => {
      expect(isNonEmptyString(input)).toBe(expected);
    });
  });

  describe('checkMaxBytesString', () => {
    const TEST_STRING = 'hello world!';

    it.each([
      { maxBytes: 10, expected: 'hello worl' },
      { maxBytes: 11, expected: 'hello world' },
      { maxBytes: 12, expected: TEST_STRING },
      { maxBytes: 13, expected: TEST_STRING },
    ])(`should cut string (${TEST_STRING}) if it exceeds maxBytes ($maxBytes bytes)`, ({ maxBytes, expected }) => {
      expect(checkMaxBytesString(TEST_STRING, maxBytes)).toBe(expected);
    });
  });

  describe('flattenResultItemList', () => {
    interface ITestItem {
      resultList?: INestedTestItem[];
      anotherList?: INestedTestItem[];
    }

    interface INestedTestItem {
      id: number;
      label: string;
    }

    it('should flatten nested result item list (with map function)', async () => {
      const inputList = [
        [
          {
            resultList: [
              { id: 1, label: 'Item 1' },
              { id: 2, label: 'Item 2' },
              { id: 3, label: 'Item 3' },
            ],
          },
        ],
        [
          {
            anotherList: [
              { id: 4, label: 'Item 4' },
              { id: 5, label: 'Item 5' },
            ],
          },
        ],
        [
          {
            resultList: [
              { id: 6, label: 'Item 6' },
              { id: 7, label: 'Item 7' },
              { id: 8, label: 'Item 8' },
              { id: 9, label: 'Item 9' },
            ],
          },
        ],
      ];
      const result = await flattenResultItemList<ITestItem, INestedTestItem>(inputList, item => item.resultList);

      expect(result).toEqual([
        { id: 1, label: 'Item 1' },
        { id: 2, label: 'Item 2' },
        { id: 3, label: 'Item 3' },
        { id: 6, label: 'Item 6' },
        { id: 7, label: 'Item 7' },
        { id: 8, label: 'Item 8' },
        { id: 9, label: 'Item 9' },
      ]);
    });
  });
});
