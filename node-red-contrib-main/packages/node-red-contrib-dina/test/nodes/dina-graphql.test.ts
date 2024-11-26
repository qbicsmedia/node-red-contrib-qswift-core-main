import DinaGraphQL, { IDinaGraphQLNode, IDinaGraphQLNodeConfig } from '@dina/nodes/dina-graphql';
import DinaGraphQLConfig, { IDinaGraphQLConfigNode } from '@dina/nodes/dina-graphql-config';
import helper, { TestFlowsItem } from 'node-red-node-test-helper';

jest.mock('axios');

helper.init(require.resolve('node-red'));
describe('dina-graphql', () => {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(() => helper.stopServer(done));
  });

  it('should handle message', function (done) {
    const flow = [
      { id: 'f1', type: 'tab', label: 'Test Flow' },
      createTestGraphqlConfigFlow(),
      createTestGraphqlFlow(),
      { id: 'successNode', z: 'f1', type: 'helper' },
      { id: 'errorNode', z: 'f1', type: 'helper' },
    ];

    helper.load([DinaGraphQLConfig, DinaGraphQL], flow, function () {
      const n1 = helper.getNode('n1') as IDinaGraphQLNode;
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

  function createTestGraphqlConfigFlow(): TestFlowsItem<IDinaGraphQLConfigNode> {
    return {
      id: 'n0',
      z: 'f1',
      type: 'dina-graphql-config',
      assumeRoleArn: 'test assume role',
      endpoint: 'endpoint',
      name: 'Dina graphql config',
    };
  }

  function createTestGraphqlFlow(): TestFlowsItem<IDinaGraphQLNodeConfig> {
    return {
      id: 'n1',
      z: 'f1',
      type: 'dina-graphql',
      config: 'n0',
      wires: [['successNode'], ['errorNode']],
    };
  }
});
