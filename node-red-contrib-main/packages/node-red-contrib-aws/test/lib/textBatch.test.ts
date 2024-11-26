import RED from 'node-red';

import { ITextBatchConfig, TextBatch } from '../../src/lib/textBatch';

describe('textBatch', () => {
  const testTextLists = ['hello', 'world', 'foo', 'bar', 'baz'];
  const testProcessBatchFn = async (batchChunks: string[][]): Promise<string[][]> => batchChunks;

  it.each([
    { textList: 'hello' },
    { textList: 123 },
    { textList: true },
    { textList: null },
    { textList: undefined },
    { textList: {} },
  ])('should throw an error if text list is not an array ($textList)', async ({ textList }) => {
    const batch = createTextBatch();

    // @ts-expect-error wrong type (testing purpose)
    expect(async () => await batch.handleBatch(textList, () => {})).rejects.toThrow('No text list as payload found.');
  });

  it('should handle batch', async () => {
    const expectedResult = [
      ['hello', 'world', 'foo'],
      ['bar', 'baz'],
    ];

    const batch = createTextBatch({ batchSize: 3 });
    const result = await batch.handleBatch(testTextLists, testProcessBatchFn);

    expect(result).toEqual(expectedResult);
  });

  it('should log handle batch if loggingEnabled is active', async () => {
    const expectedResult = [['hello', 'world'], ['foo', 'bar'], ['baz']];

    const spy = jest.spyOn(RED.log, 'info');
    const batch = createTextBatch({ loggingEnabled: true });

    expect(spy).not.toHaveBeenCalled();
    const result = await batch.handleBatch(testTextLists, testProcessBatchFn);
    expect(spy).toHaveBeenCalled();
    expect(spy).toHaveBeenNthCalledWith(
      1,
      '[node:my-node-id] [batch:test] Processing 5 document(s) in 3 batch(es) with max 2 document(s).',
    );
    expect(spy).toHaveBeenNthCalledWith(
      2,
      '[node:my-node-id] [batch:test] 5 document(s) in 3 batch(es) processed successfully (3 item(s)).',
    );
    expect(result).toEqual(expectedResult);
  });

  it('should not log handle batch if loggingEnabled is not active', async () => {
    const expectedResult = [['hello', 'world'], ['foo', 'bar'], ['baz']];

    const spy = jest.spyOn(RED.log, 'info');
    const batch = createTextBatch({ loggingEnabled: false });

    expect(spy).not.toHaveBeenCalled();
    const result = await batch.handleBatch(testTextLists, testProcessBatchFn);
    expect(spy).not.toHaveBeenCalled();
    expect(result).toEqual(expectedResult);
  });

  function createTextBatch(options: Partial<ITextBatchConfig> = {}): TextBatch {
    return new TextBatch({
      nodeId: 'my-node-id',
      type: 'test',
      batchSize: 2,
      loggingEnabled: false,
      redLogger: RED.log,
      ...options,
    });
  }
});
