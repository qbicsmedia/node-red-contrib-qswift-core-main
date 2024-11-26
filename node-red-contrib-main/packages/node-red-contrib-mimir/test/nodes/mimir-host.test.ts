import helper, { TestFlowsItem } from 'node-red-node-test-helper';

import MimirHostNode, {
  IMimirHostNode,
  IMimirHostNodeConfig,
  IMimirHostNodeTenantCustomBaseUrl,
} from '../../src/nodes/mimir-host';

helper.init(require.resolve('node-red'));

describe('mimir-host', () => {
  const testBaseUrl = 'https://base-url.local';
  const testCustomBaseUrls = [
    { tenantName: 'tenant1', baseUrl: 'https://tenant1.local' },
    { tenantName: 'tenant2', baseUrl: 'https://tenant2.local' },
  ];
  const testTenants = [
    { name: 'tenant1', apiKey: 'apiKey1' },
    { name: 'tenant2', apiKey: 'apiKey2' },
    { name: 'tenant3', apiKey: 'apiKey3' },
  ];

  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(() => helper.stopServer(done));
  });

  it('should have correct properties', async () => {
    const flow = createTestFlow(testBaseUrl, testCustomBaseUrls);
    const testCredentials = {
      n1: {
        tenants: testTenants,
      },
    };

    await helper.load(MimirHostNode, flow, testCredentials);
    const n1 = helper.getNode('n1') as IMimirHostNode;

    expect(n1).toHaveProperty('name');
    expect(n1).toHaveProperty('baseUrl');
    expect(n1).toHaveProperty('customBaseUrls');
    expect(n1).toHaveProperty('credentials');

    expect(n1.name).toBe('Mimir Config');
    expect(n1.baseUrl).toBe(testBaseUrl);
    expect(n1.customBaseUrls).toEqual(testCustomBaseUrls);
    expect(n1.credentials.tenants).toEqual(testTenants);
  });

  it('should have null on misconfigured baseUrl', async () => {
    // @ts-expect-error wrong type (testing purpose)
    const flow = createTestFlow(1234, []);
    await helper.load(MimirHostNode, flow);
    const n1 = helper.getNode('n1') as IMimirHostNode;

    expect(n1).toHaveProperty('baseUrl');
    expect(n1.baseUrl).toBe(null);
  });

  function createTestFlow(
    baseUrl: string,
    customBaseUrls: IMimirHostNodeTenantCustomBaseUrl[],
  ): TestFlowsItem<IMimirHostNodeConfig>[] {
    return [{ id: 'n1', type: 'mimir-host', name: 'Mimir Config', baseUrl, customBaseUrls }];
  }
});
