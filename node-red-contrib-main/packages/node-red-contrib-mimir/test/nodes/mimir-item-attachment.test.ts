import helper, { TestFlowsItem } from 'node-red-node-test-helper';

import MimirHostNode from '../../src/nodes/mimir-host';
import MimirItemAttachmentNode, {
  IMimirItemAttachmentNode,
  IMimirItemAttachmentNodeConfig,
  IMimirItemAttachmentNodeCreateMessageIn,
  IMimirItemAttachmentNodeDeleteMessageIn,
  IMimirItemAttachmentNodeFetchMessageIn,
  IMimirItemAttachmentNodeMessage,
  IMimirItemAttachmentNodeUpdateMessageIn,
} from '../../src/nodes/mimir-item-attachment';
import * as MimirItemAttachmentRequestModule from '../../src/lib/MimirItemAttachmentRequest';

import { createApiRequestTestSetup, createTestOutputHelper, TEST_ERROR_TEXT, TEST_ITEM_ID } from '../helper';

const requestProto = MimirItemAttachmentRequestModule.MimirItemAttachmentRequest.prototype;
const mockedFetchList = jest.fn() as jest.MockedFunction<typeof requestProto.fetchList>;
const mockedFetch = jest.fn() as jest.MockedFunction<typeof requestProto.fetch>;
const mockedCreate = jest.fn() as jest.MockedFunction<typeof requestProto.create>;
const mockedUpdate = jest.fn() as jest.MockedFunction<typeof requestProto.update>;
const mockedDelete = jest.fn() as jest.MockedFunction<typeof requestProto.delete>;

jest.mock<typeof import('../../src/lib/MimirItemAttachmentRequest')>('../../src/lib/MimirItemAttachmentRequest', () => {
  return {
    MimirItemAttachmentRequest: jest.fn().mockImplementation(() => {
      return {
        fetchList: mockedFetchList,
        fetch: mockedFetch,
        create: mockedCreate,
        update: mockedUpdate,
        delete: mockedDelete,
      };
    }),
  };
});

helper.init(require.resolve('node-red'));

describe('mimir-item-attachment', () => {
  const { createInputMessage, createTestHostFlow, createTestCredentials } = createApiRequestTestSetup();
  const { testErrorOutput, testSuccessOutput } = createTestOutputHelper(helper);

  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(() => helper.stopServer(done));
  });

  it('should have configured properties', async () => {
    await setupTest({
      operation: 'getList',
      forceOverwrite: true,
      output: 'myOutputProp',
      tenantPath: 'myTenantProp',
      tenantPathType: 'myTenantPathType',
    });

    const n1 = helper.getNode('n1') as IMimirItemAttachmentNode;

    expect(n1).toHaveProperty('operation');
    expect(n1).toHaveProperty('forceOverwrite');
    expect(n1).toHaveProperty('output');
    expect(n1).toHaveProperty('tenantPath');
    expect(n1).toHaveProperty('tenantPathType');

    expect(n1.operation).toBe('getList');
    expect(n1.forceOverwrite).toBe(true);
    expect(n1.output).toBe('myOutputProp');
    expect(n1.tenantPath).toBe('myTenantProp');
    expect(n1.tenantPathType).toBe('myTenantPathType');
  });

  describe('operations', () => {
    const mockedItems = [
      { fileName: 'file1.png', type: 'file', role: 'file' },
      { fileName: 'file2.png', type: 'file', role: 'file' },
      { fileName: 'file3.png', type: 'file', role: 'file' },
    ] as MimirItemAttachmentRequestModule.IItemAttachment[];

    it('should handle "getList" operation', async () => {
      mockedFetchList.mockResolvedValue(mockedItems);
      await setupTest({ operation: 'getList' });

      const n1 = helper.getNode('n1') as IMimirItemAttachmentNode;
      const inputMessage = createInputMessage({ itemId: TEST_ITEM_ID });

      n1.receive(inputMessage);

      expect(mockedFetchList).not.toHaveBeenCalled();
      await testSuccessOutput(async (_msg: unknown) => {
        expect(mockedFetchList).toHaveBeenCalledWith(TEST_ITEM_ID);

        const msg = _msg as IMimirItemAttachmentNodeMessage;
        expect(msg).toHaveProperty('output');
        expect(msg.output).toEqual(mockedItems);
      });
    });

    it('should handle "fetch" operation', async () => {
      const mockedItem = mockedItems[0];
      mockedFetch.mockResolvedValue(mockedItem);

      await setupTest({ operation: 'fetch' });

      const n1 = helper.getNode('n1') as IMimirItemAttachmentNode;
      const attachment = 'file.png';
      const inputMessage = createInputMessage({ itemId: TEST_ITEM_ID, attachment });

      n1.receive(inputMessage);

      expect(mockedFetch).not.toHaveBeenCalled();
      await testSuccessOutput(async (_msg: unknown) => {
        expect(mockedFetch).toHaveBeenCalledWith(TEST_ITEM_ID, attachment);

        const msg = _msg as IMimirItemAttachmentNodeFetchMessageIn;
        expect(msg).toHaveProperty('output');
        expect(msg.output).toEqual(mockedItem);
      });
    });

    it.each([{ forceOverwrite: true }, { forceOverwrite: false }])(
      'should handle "create" operation (forceOverwrite: $forceOverwrite)',
      async ({ forceOverwrite }) => {
        const payload = mockedItems[0];
        const uploadContent = { test: true };
        mockedCreate.mockResolvedValue(undefined);

        await setupTest({ operation: 'create', forceOverwrite });

        const n1 = helper.getNode('n1') as IMimirItemAttachmentNode;
        const inputMessage = createInputMessage({
          itemId: TEST_ITEM_ID,
          payload,
          uploadContent,
        });

        n1.receive(inputMessage);

        await testSuccessOutput(async (_msg: unknown) => {
          expect(mockedCreate).toHaveBeenCalledWith(TEST_ITEM_ID, payload, uploadContent, forceOverwrite);

          const msg = _msg as IMimirItemAttachmentNodeCreateMessageIn;
          expect(msg).toHaveProperty('output');
          expect(msg.output).toEqual(undefined);
        });
      },
    );

    it('should handle "update" operation', async () => {
      const payload = mockedItems[0];
      mockedUpdate.mockResolvedValue(payload);

      await setupTest({ operation: 'update' });

      const n1 = helper.getNode('n1') as IMimirItemAttachmentNode;
      const inputMessage = createInputMessage({ itemId: TEST_ITEM_ID, payload });

      n1.receive(inputMessage);

      expect(mockedUpdate).not.toHaveBeenCalled();
      await testSuccessOutput(async (_msg: unknown) => {
        expect(mockedUpdate).toHaveBeenCalledWith(TEST_ITEM_ID, payload);

        const msg = _msg as IMimirItemAttachmentNodeUpdateMessageIn;
        expect(msg).toHaveProperty('output');
        expect(msg.output).toEqual(payload);
      });
    });

    it('should handle "delete" operation', async () => {
      const payload = {
        fileName: 'file1.png',
        type: 'file',
      };
      mockedDelete.mockResolvedValue('');

      await setupTest({ operation: 'delete' });

      const n1 = helper.getNode('n1') as IMimirItemAttachmentNode;
      const inputMessage = createInputMessage({ itemId: TEST_ITEM_ID, payload });

      n1.receive(inputMessage);

      expect(mockedDelete).not.toHaveBeenCalled();
      await testSuccessOutput(async (_msg: unknown) => {
        expect(mockedDelete).toHaveBeenCalledWith(TEST_ITEM_ID, payload);

        const msg = _msg as IMimirItemAttachmentNodeDeleteMessageIn;
        expect(msg).toHaveProperty('output');
        expect(msg.output).toEqual('');
      });
    });

    it('should throw an error on invalid operation', async () => {
      // @ts-expect-error wrong type (testing purpose)
      await setupTest({ operation: 'invalidOperation' });
      const n1 = helper.getNode('n1') as IMimirItemAttachmentNode;

      await new Promise(resolve => {
        n1.receive(createInputMessage());
        // @ts-expect-error signature not declared
        n1.on('call:error', call => {
          call.should.be.calledWithMatch('is not supported!');
          resolve({});
        });
      });
    });

    it('should forward api error to error output', async () => {
      mockedFetch.mockRejectedValue(TEST_ERROR_TEXT);
      await setupTest({ operation: 'fetch' });

      const n1 = helper.getNode('n1') as IMimirItemAttachmentNode;
      const inputMessage = createInputMessage();

      n1.receive(inputMessage);

      await testErrorOutput(async (_msg: unknown) => {
        const msg = _msg as IMimirItemAttachmentNodeFetchMessageIn;
        expect(msg).toHaveProperty('error');
        expect(msg.error).toEqual(TEST_ERROR_TEXT);
      });
    });
  });

  it('should throw an error if config is not found', async () => {
    const flow = [createTestMimirItemAttachmentFlow({})];
    await helper.load([MimirHostNode, MimirItemAttachmentNode], flow, createTestCredentials());
    const n1 = helper.getNode('n1') as IMimirItemAttachmentNode;

    await new Promise(resolve => {
      // @ts-expect-error signature not declared
      n1.on('call:error', call => {
        call.should.be.calledWithExactly('No Mimir host config found!');
        resolve({});
      });
    });
  });

  async function setupTest(itemAttachmentFlowOptions: Partial<IMimirItemAttachmentNodeConfig> = {}): Promise<void> {
    const flow = [
      { id: 'f1', type: 'tab', label: 'Test Flow' },
      createTestHostFlow(),
      createTestMimirItemAttachmentFlow(itemAttachmentFlowOptions),
      { id: 'successNode', z: 'f1', type: 'helper' },
      { id: 'errorNode', z: 'f1', type: 'helper' },
    ];

    await helper.load([MimirHostNode, MimirItemAttachmentNode], flow, createTestCredentials());
  }

  function createTestMimirItemAttachmentFlow(
    options: Partial<IMimirItemAttachmentNodeConfig>,
  ): TestFlowsItem<IMimirItemAttachmentNodeConfig> {
    return {
      id: 'n1',
      z: 'f1',
      type: 'mimir-item-attachment',
      host: 'n0',
      operation: 'fetch',
      forceOverwrite: false,
      output: 'output',
      tenantPath: 'tenant',
      tenantPathType: 'msg',
      wires: [['successNode'], ['errorNode']],
      ...options,
    };
  }
});
