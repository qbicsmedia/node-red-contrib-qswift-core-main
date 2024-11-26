import helper, { TestFlowsItem } from 'node-red-node-test-helper';
import { NodeMessageInFlow } from 'node-red';

import MimirHostNode from '../../src/nodes/mimir-host';
import MimirHttpRequestNode, {
  IMimirHttpRequestNode,
  IMimirHttpRequestNodeConfig,
} from '../../src/nodes/mimir-httpRequest';

import * as MimirApiRequestModule from '../../src/lib/MimirApiRequest';

import { createApiRequestTestSetup, createTestOutputHelper, TEST_ERROR_TEXT, TEST_ITEM_ID } from '../helper';

const mockedRequest = jest.fn() as jest.MockedFunction<typeof MimirApiRequestModule.MimirApiRequest.prototype.request>;

jest.mock<typeof import('../../src/lib/MimirApiRequest')>('../../src/lib/MimirApiRequest', () => {
  return {
    MimirApiRequest: jest.fn().mockImplementation(() => {
      return {
        request: mockedRequest,
      };
    }),
  };
});

helper.init(require.resolve('node-red'));

describe('mimir-httpRequest', () => {
  const { createInputMessage, createTestHostFlow, createTestCredentials } = createApiRequestTestSetup();
  const { testErrorOutput, testSuccessOutput } = createTestOutputHelper(helper);

  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(() => helper.stopServer(done));
  });

  it('should have configured properties', async () => {
    const variables = [{ name: 'itemId', mappingType: 'msg', mappingProperty: 'itemId' }];
    await setupTest({
      api: 'node',
      method: 'PUT',
      path: '/path/to/api/{itemId}',
      variables,
      complete: 'myOutputProp',
      tenantPath: 'myTenantProp',
      tenantPathType: 'myTenantPathType',
      verboseLogging: true,
    });

    const n1 = helper.getNode('n1') as IMimirHttpRequestNode;

    expect(n1).toHaveProperty('api');
    expect(n1).toHaveProperty('method');
    expect(n1).toHaveProperty('path');
    expect(n1).toHaveProperty('variables');
    expect(n1).toHaveProperty('complete');
    expect(n1).toHaveProperty('tenantPath');
    expect(n1).toHaveProperty('tenantPathType');
    expect(n1).toHaveProperty('verboseLogging');

    expect(n1.api).toBe('node');
    expect(n1.method).toBe('PUT');
    expect(n1.path).toBe('/path/to/api/{itemId}');
    expect(n1.variables).toEqual(variables);
    expect(n1.complete).toBe('myOutputProp');
    expect(n1.tenantPath).toBe('myTenantProp');
    expect(n1.tenantPathType).toBe('myTenantPathType');
    expect(n1.verboseLogging).toBe(true);
  });

  it('should get configuration from node', async () => {
    const mockedItem = { id: TEST_ITEM_ID, label: 'Item 1' };
    mockedRequest.mockResolvedValue(mockedItem);

    await setupTest({
      api: 'node',
      method: 'PUT',
      path: '/path/to/somewhere/{itemId}',
      variables: [{ name: 'itemId', mappingType: 'msg', mappingProperty: 'itemId' }],
    });

    const n1 = helper.getNode('n1') as IMimirHttpRequestNode;
    const payload = { label: 'Item 1' };
    const inputMessage = createInputMessage({ itemId: TEST_ITEM_ID, payload });

    n1.receive(inputMessage);

    expect(mockedRequest).not.toHaveBeenCalled();
    await testSuccessOutput(async (_msg: unknown) => {
      expect(mockedRequest).toHaveBeenCalledWith('PUT', `/path/to/somewhere/${TEST_ITEM_ID}`, payload);

      const msg = _msg as NodeMessageInFlow & { output: typeof mockedItem };
      expect(msg).toHaveProperty('output');
      expect(msg.output).toEqual(mockedItem);
    });
  });

  it('should get configuration from message', async () => {
    const mockedItem = { id: TEST_ITEM_ID, label: 'Item 1' };
    mockedRequest.mockResolvedValue(mockedItem);

    await setupTest({ api: 'message' });

    const n1 = helper.getNode('n1') as IMimirHttpRequestNode;
    const payload = { label: 'Item 1' };
    const inputMessage = createInputMessage({
      itemId: TEST_ITEM_ID,
      method: 'POST',
      path: '/path/to/elsewhere',
      payload,
    });

    n1.receive(inputMessage);

    expect(mockedRequest).not.toHaveBeenCalled();
    await testSuccessOutput(async (_msg: unknown) => {
      expect(mockedRequest).toHaveBeenCalledWith('POST', '/path/to/elsewhere', payload);

      const msg = _msg as NodeMessageInFlow & { output: typeof mockedItem };
      expect(msg).toHaveProperty('output');
      expect(msg.output).toEqual(mockedItem);
    });
  });

  it.each([
    { method: 123, path: '/path/to/otherwise' },
    { method: 'GET', path: 2345 },
  ])('should warn on invalid method/path (message)', async ({ method, path }) => {
    await setupTest({ api: 'message' });

    const n1 = helper.getNode('n1') as IMimirHttpRequestNode;
    const inputMessage = createInputMessage({ method, path });

    n1.receive(inputMessage);

    await new Promise(resolve => {
      // @ts-expect-error signature not declared
      n1.on('call:warn', call => {
        call.should.be.calledWithMatch('Invalid method/path configuration!');
        resolve({});
      });
    });
  });

  it('should warn on invalid method/path (node)', async () => {
    await setupTest({
      api: 'node',
      method: undefined,
      path: undefined,
      variables: undefined,
    });

    const n1 = helper.getNode('n1') as IMimirHttpRequestNode;
    n1.receive(createInputMessage());

    await new Promise(resolve => {
      // @ts-expect-error signature not declared
      n1.on('call:warn', call => {
        call.should.be.calledWithMatch('Invalid method/path configuration!');
        resolve({});
      });
    });
  });

  it('should forward api error to error output', async () => {
    mockedRequest.mockRejectedValue(TEST_ERROR_TEXT);

    await setupTest();

    const n1 = helper.getNode('n1') as IMimirHttpRequestNode;
    const inputMessage = createInputMessage();

    n1.receive(inputMessage);

    await testErrorOutput(async (_msg: unknown) => {
      const msg = _msg as NodeMessageInFlow & { error: unknown };
      expect(msg).toHaveProperty('error');
      expect(msg.error).toEqual(TEST_ERROR_TEXT);
    });
  });

  it('should throw an error if config is not found', async () => {
    const flow = [createTestMimirHttpRequestFlow({})];
    await helper.load([MimirHostNode, MimirHttpRequestNode], flow, createTestCredentials());
    const n1 = helper.getNode('n1') as IMimirHttpRequestNode;

    await new Promise(resolve => {
      // @ts-expect-error signature not declared
      n1.on('call:error', call => {
        call.should.be.calledWithExactly('No Mimir host config found!');
        resolve({});
      });
    });
  });

  async function setupTest(httpRequestFlowOptions: Partial<IMimirHttpRequestNodeConfig> = {}): Promise<void> {
    const flow = [
      { id: 'f1', type: 'tab', label: 'Test Flow' },
      createTestHostFlow(),
      createTestMimirHttpRequestFlow(httpRequestFlowOptions),
      { id: 'successNode', z: 'f1', type: 'helper' },
      { id: 'errorNode', z: 'f1', type: 'helper' },
    ];

    await helper.load([MimirHostNode, MimirHttpRequestNode], flow, createTestCredentials());
  }

  function createTestMimirHttpRequestFlow(
    options: Partial<IMimirHttpRequestNodeConfig>,
  ): TestFlowsItem<IMimirHttpRequestNodeConfig> {
    return {
      id: 'n1',
      z: 'f1',
      type: 'mimir-httpRequest',
      host: 'n0',
      api: 'node',
      method: 'GET',
      path: '/path/to/somewhere',
      variables: [],
      complete: 'output',
      tenantPath: 'tenant',
      tenantPathType: 'msg',
      verboseLogging: false,
      wires: [['successNode'], ['errorNode']],
      ...options,
    };
  }
});
