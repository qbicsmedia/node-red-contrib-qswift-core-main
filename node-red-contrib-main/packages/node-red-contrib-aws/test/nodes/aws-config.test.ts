import helper, { TestFlowsItem } from 'node-red-node-test-helper';

import AWSConfigNode, { IAWSConfigNode } from '../../src/nodes/aws-config';

helper.init(require.resolve('node-red'));

describe('mimir-host', () => {
  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(() => helper.stopServer(done));
  });

  it('should have correct properties', async () => {
    const flow = createTestFlow('myRegion', 'CREDENTIALS');
    const testCredentials = {
      n1: {
        accessKeyId: 'myAccessKeyId',
        secretAccessKey: 'mySecretAccessKey',
        assumeRoleArn: 'myAssumeRoleArn',
      },
    };

    await helper.load(AWSConfigNode, flow, testCredentials);
    const n1 = helper.getNode('n1') as IAWSConfigNode;

    expect(n1).toHaveProperty('name');
    expect(n1).toHaveProperty('region');
    expect(n1).toHaveProperty('authType');
    expect(n1).toHaveProperty('credentials');

    expect(n1.name).toBe('AWS Config');
    expect(n1.region).toBe('myRegion');
    expect(n1.authType).toBe('CREDENTIALS');

    expect(n1.credentials.accessKeyId).toBe('myAccessKeyId');
    expect(n1.credentials.secretAccessKey).toBe('mySecretAccessKey');
    expect(n1.credentials.assumeRoleArn).toBe('myAssumeRoleArn');
  });

  function createTestFlow(region: string, authType: string): TestFlowsItem<IAWSConfigNode>[] {
    return [{ id: 'n1', type: 'aws-config', name: 'AWS Config', region, authType }];
  }
});
