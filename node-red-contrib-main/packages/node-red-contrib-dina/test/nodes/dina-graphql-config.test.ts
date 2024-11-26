import DinaGraphQLConfig, { IDinaGraphQLConfigNode } from '@dina/nodes/dina-graphql-config';
import helper, { TestFlowsItem } from 'node-red-node-test-helper';

helper.init(require.resolve('node-red'));

describe('dina-graphql-config()', () => {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(() => helper.stopServer(done));
  });

  it('should have correct properties', async () => {
    const name = 'dina-graphql-config';
    const flow = createTestFlow(name, 'endpoint', 'assumeRoleArn');
    const testCredentials = {
      n1: {
        apiKey: 'apiKey',
      },
    };

    await helper.load(DinaGraphQLConfig, flow, testCredentials);
    const n1 = helper.getNode('n1') as IDinaGraphQLConfigNode;

    expect(n1).toHaveProperty('name');
    expect(n1).toHaveProperty('endpoint');
    expect(n1).toHaveProperty('assumeRoleArn');

    expect(n1.endpoint).toBe('endpoint');
    expect(n1.name).toBe(name);
    expect(n1.assumeRoleArn).toBe('assumeRoleArn');
  });

  function createTestFlow(
    name: string,
    endpoint: string,
    assumeRoleArn: string,
  ): TestFlowsItem<IDinaGraphQLConfigNode>[] {
    return [{ id: 'n1', type: 'dina-graphql-config', name, endpoint, assumeRoleArn }];
  }
});
