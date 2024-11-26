import helper, { TestFlowsItem } from 'node-red-node-test-helper';
import { NodeMessageInFlow } from 'node-red';

import MimirHostNode from '../../src/nodes/mimir-host';
import MimirRetrieveItemsNode, {
  IMimirItemMapping,
  IMimirRetrieveItemsNode,
  IMimirRetrieveItemsNodeConfig,
  TMimirRetrieveItemsNodeResult,
} from '../../src/nodes/mimir-retrieve-items';

import * as MimirApiRequestModule from '../../src/lib/MimirApiRequest';

import { createApiRequestTestSetup, createTestOutputHelper, TEST_ERROR_TEXT } from '../helper';

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

describe('mimir-retrieve-items', () => {
  const { createInputMessage, createTestHostFlow, createTestCredentials } = createApiRequestTestSetup();
  const { testErrorOutput, testSuccessOutput } = createTestOutputHelper(helper);
  const testItemIds = ['m1m1r-173m-1d-1', 'm1m1r-173m-1d-2', 'm1m1r-173m-1d-3'];

  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(() => helper.stopServer(done));
  });

  it('should have configured properties', async () => {
    await setupTest({
      output: 'myOutputProp',
      outputAsList: true,
      tenantPath: 'myTenantProp',
      tenantPathType: 'myTenantPathType',
    });

    const n1 = helper.getNode('n1') as IMimirRetrieveItemsNode;

    expect(n1).toHaveProperty('output');
    expect(n1).toHaveProperty('outputAsList');
    expect(n1).toHaveProperty('tenantPath');
    expect(n1).toHaveProperty('tenantPathType');

    expect(n1.output).toBe('myOutputProp');
    expect(n1.outputAsList).toBe(true);
    expect(n1.tenantPath).toBe('myTenantProp');
    expect(n1.tenantPathType).toBe('myTenantPathType');
  });

  it('should return items as array when "outputAsList" is enabled', async () => {
    const resultItems = testItemIds.map((itemId, idx) => ({
      id: itemId,
      label: `Item ${idx + 1}`,
    }));

    await setupTest({ outputAsList: true });
    await testRetrieveItemsOutput(testItemIds, resultItems);
  });

  it('should return items as mapping when "outputAsList" is not enabled', async () => {
    const resultItems = testItemIds.reduce((memo, itemId, idx) => {
      memo[itemId] = {
        id: itemId,
        label: `Item ${idx + 1}`,
      };
      return memo;
    }, {} as IMimirItemMapping);

    await setupTest({ outputAsList: false });
    await testRetrieveItemsOutput(testItemIds, resultItems);
  });

  it.each([{ itemIds: [] }, { itemIds: 123 }, { itemIds: 'hello world' }, { itemIds: true }])(
    'should throw an error if "itemIds" is not an array or empty ($itemIds)',
    async ({ itemIds }) => {
      await setupTest();

      const n1 = helper.getNode('n1') as IMimirRetrieveItemsNode;
      const inputMessage = createInputMessage({ itemIds });

      n1.receive(inputMessage);

      await new Promise(resolve => {
        // @ts-expect-error signature not declared
        n1.on('call:error', call => {
          call.should.be.calledWithExactly('"itemIds" is either not an array or it is empty.');
          resolve({});
        });
      });
    },
  );

  it('should forward api error to error output', async () => {
    mockedRequest.mockRejectedValue(TEST_ERROR_TEXT);

    await setupTest();

    const n1 = helper.getNode('n1') as IMimirRetrieveItemsNode;
    const inputMessage = createInputMessage({ itemIds: testItemIds });

    n1.receive(inputMessage);

    await testErrorOutput(async (_msg: unknown) => {
      const msg = _msg as NodeMessageInFlow & { error: unknown };
      expect(msg).toHaveProperty('error');
      expect(msg.error).toEqual(TEST_ERROR_TEXT);
    });
  });

  it('should throw an error if config is not found', async () => {
    const flow = [createTestMimirRetrieveItemsFlow({})];
    await helper.load([MimirHostNode, MimirRetrieveItemsNode], flow, createTestCredentials());
    const n1 = helper.getNode('n1') as IMimirRetrieveItemsNode;

    await new Promise(resolve => {
      // @ts-expect-error signature not declared
      n1.on('call:error', call => {
        call.should.be.calledWithExactly('No Mimir host config found!');
        resolve({});
      });
    });
  });

  async function testRetrieveItemsOutput(itemIds: string[], resultItems: TMimirRetrieveItemsNodeResult): Promise<void> {
    itemIds.forEach((itemId, idx) => {
      mockedRequest.mockImplementationOnce(() => Promise.resolve({ id: itemId, label: `Item ${idx + 1}` }));
    });

    const n1 = helper.getNode('n1') as IMimirRetrieveItemsNode;
    const inputMessage = createInputMessage({ itemIds });

    n1.receive(inputMessage);

    expect(mockedRequest).not.toHaveBeenCalled();
    await testSuccessOutput(async (_msg: unknown) => {
      expect(mockedRequest.mock.calls.length).toBe(itemIds.length);
      itemIds.forEach((itemId, idx) => {
        expect(mockedRequest).toHaveBeenNthCalledWith(
          idx + 1,
          'GET',
          `/api/v1/items/${itemId}?readableMetadataFields=true`,
        );
      });

      const msg = _msg as NodeMessageInFlow & { output: TMimirRetrieveItemsNodeResult };
      expect(msg).toHaveProperty('output');
      expect(msg.output).toEqual(resultItems);
    });
  }

  async function setupTest(retrieveItemsFlowOptions: Partial<IMimirRetrieveItemsNodeConfig> = {}): Promise<void> {
    const flow = [
      { id: 'f1', type: 'tab', label: 'Test Flow' },
      createTestHostFlow(),
      createTestMimirRetrieveItemsFlow(retrieveItemsFlowOptions),
      { id: 'successNode', z: 'f1', type: 'helper' },
      { id: 'errorNode', z: 'f1', type: 'helper' },
    ];

    await helper.load([MimirHostNode, MimirRetrieveItemsNode], flow, createTestCredentials());
  }

  function createTestMimirRetrieveItemsFlow(
    options: Partial<IMimirRetrieveItemsNodeConfig>,
  ): TestFlowsItem<IMimirRetrieveItemsNodeConfig> {
    return {
      id: 'n1',
      z: 'f1',
      type: 'mimir-retrieve-items',
      host: 'n0',
      output: 'output',
      outputAsList: true,
      tenantPath: 'tenant',
      tenantPathType: 'msg',
      wires: [['successNode'], ['errorNode']],
      ...options,
    };
  }
});
