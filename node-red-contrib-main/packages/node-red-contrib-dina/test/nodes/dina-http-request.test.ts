import DinaConfigNode, { IDinaConfigNodeConfig } from '@dina/nodes/dina-config';
import DinaHttpRequest, { IDinaHttpRequestNode, IDinaHttpRequestNodeConfig } from '@dina/nodes/dina-http-request';
import helper, { TestFlowsItem } from 'node-red-node-test-helper';

jest.mock('axios');

helper.init(require.resolve('node-red'));
describe('dina-http-request', () => {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(() => helper.stopServer(done));
  });

  it('should handle message', function (done) {
    const flow = [
      { id: 'f1', type: 'tab', label: 'Test Flow' },
      createTestDinaConfig(),
      createTestDinaHttpRequestFlow(),
      { id: 'successNode', z: 'f1', type: 'helper' },
      { id: 'errorNode', z: 'f1', type: 'helper' },
    ];

    helper.load([DinaConfigNode, DinaHttpRequest], flow, createTestCredentials(), function () {
      const n1 = helper.getNode('n1') as IDinaHttpRequestNode;
      const payload = { data: 'test-data' };
      const inputMessage = createInputMessage({ payload: { method: 'GET', path: '/test/path', payload } });
      n1.on('input', function (msg) {
        try {
          expect(msg).toHaveProperty('payload');
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive(inputMessage);
    });
  });
  function createInputMessage(props: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      ...props,
    };
  }

  function createTestDinaConfig(): TestFlowsItem<IDinaConfigNodeConfig> {
    return {
      id: 'n0',
      z: 'f1',
      type: 'dina-config',
      baseUrl: 'baseUrl',
      name: 'Dina Config',
    };
  }

  function createTestDinaHttpRequestFlow(): TestFlowsItem<IDinaHttpRequestNodeConfig> {
    return {
      id: 'n1',
      z: 'f1',
      type: 'dina-http-request',
      config: 'n0',
      wires: [['successNode'], ['errorNode']],
    };
  }

  function createTestCredentials(configNodeId: string = 'n0'): { [key: string]: unknown } {
    return {
      [configNodeId]: {
        apiKey: 'apiKey',
      },
    };
  }
});
