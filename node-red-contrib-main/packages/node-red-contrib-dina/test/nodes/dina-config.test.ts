import DinaConfigNode, { IDinaConfigNode } from '@dina/nodes/dina-config';
import helper, { TestFlowsItem } from 'node-red-node-test-helper';

helper.init(require.resolve('node-red'));

describe('dina-config', () => {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(() => helper.stopServer(done));
  });

  it('should have correct properties', async () => {
    const flow = createTestFlow('http://test');
    const testCredentials = {
      n1: {
        apiKey: 'apiKey',
      },
    };

    await helper.load(DinaConfigNode, flow, testCredentials);
    const n1 = helper.getNode('n1') as IDinaConfigNode;

    expect(n1).toHaveProperty('name');
    expect(n1).toHaveProperty('baseUrl');
    expect(n1).toHaveProperty('credentials');

    expect(n1.baseUrl).toBe('http://test');
  });

  function createTestFlow(baseUrl: string): TestFlowsItem<IDinaConfigNode>[] {
    return [{ id: 'n1', type: 'dina-config', name: 'DinaConfigNode', baseUrl }];
  }
});
