import { Node } from 'node-red';
import helper from 'node-red-node-test-helper';

import testNode, { ITextSplitterNode, ITextSplitterNodeMessage } from '../../src/nodes/text-splitter';

helper.init(require.resolve('node-red'));

const NODE_TYPE_NAME = 'text-splitter';

describe('text-splitter', () => {
  beforeEach(done => {
    helper.startServer(done);
  });

  afterEach(done => {
    helper.unload().then(() => helper.stopServer(done));
  });

  it.each([
    { name: 'text splitter', maxChunkChars: 500, output: 'payload' },
    { name: 'my custom name', maxChunkChars: 10, output: 'output' },
  ])(
    'should have configured values (name: $name, maxChunkChars: $maxChunkChars, output: $output)',
    async ({ name, maxChunkChars, output }) => {
      const flow = [{ id: 'n1', type: NODE_TYPE_NAME, name, maxChunkChars, output }];

      await helper.load(testNode, flow);
      const n1 = helper.getNode('n1') as ITextSplitterNode;

      expect(n1.name).toEqual(name);
      expect(n1.maxChunkChars).toEqual(maxChunkChars);
      expect(n1.output).toEqual(output);
    },
  );

  it('should output to the correct property', async () => {
    const outputProperty = 'myCustomOutputProperty';
    const payload = 'this is some text';
    const flow = [
      { id: 'n1', type: NODE_TYPE_NAME, maxChunkChars: 500, output: outputProperty, wires: [['n2']] },
      { id: 'n2', type: 'helper' },
    ];

    await helper.load(testNode, flow);

    const n1 = helper.getNode('n1') as ITextSplitterNode;
    const n2 = helper.getNode('n2') as Node;

    expect(n1.output).toEqual(outputProperty);

    await new Promise((resolve, reject) => {
      n2.on('input', (_msg: unknown) => {
        const msg = _msg as ITextSplitterNodeMessage;

        try {
          expect(msg).toHaveProperty(outputProperty);
          expect(msg[outputProperty]).toEqual([payload]);
          resolve({});
        } catch (err) {
          reject(err);
        }
      });
      n1.receive({ payload });
    });
  });
});
