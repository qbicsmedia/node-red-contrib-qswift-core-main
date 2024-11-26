import helper, { TestFlowsItem } from 'node-red-node-test-helper';
import { NodeMessageInFlow } from 'node-red';

import MimirHostNode from '../../src/nodes/mimir-host';
import MimirTransferRequestNode, {
  IMimirTransferRequestNode,
  IMimirTransferRequestNodeConfig,
} from '../../src/nodes/mimir-transferrequests';

import * as MimirTransferRequestModule from '../../src/lib/MimirTransferRequest';

import { createApiRequestTestSetup, createTestOutputHelper, TEST_ERROR_TEXT, TEST_ITEM_ID } from '../helper';

const requestProto = MimirTransferRequestModule.MimirTransferRequest.prototype;
const mockedGetAll = jest.fn() as jest.MockedFunction<typeof requestProto.getAll>;
const mockedGet = jest.fn() as jest.MockedFunction<typeof requestProto.get>;
const mockedCreate = jest.fn() as jest.MockedFunction<typeof requestProto.create>;
const mockedLock = jest.fn() as jest.MockedFunction<typeof requestProto.lock>;
const mockedDelete = jest.fn() as jest.MockedFunction<typeof requestProto.delete>;

jest.mock<typeof import('../../src/lib/MimirTransferRequest')>('../../src/lib/MimirTransferRequest', () => {
  return {
    MimirTransferRequest: jest.fn().mockImplementation(() => {
      return {
        getAll: mockedGetAll,
        get: mockedGet,
        create: mockedCreate,
        lock: mockedLock,
        delete: mockedDelete,
      };
    }),
  };
});

helper.init(require.resolve('node-red'));

describe('mimir-transferrequests', () => {
  const { createInputMessage, createTestHostFlow, createTestCredentials } = createApiRequestTestSetup();

  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(() => helper.stopServer(done));
  });

  it('should have configured properties', async () => {
    await setupTest({
      operation: 'getAll',
      output: 'myOutputProp',
      tenantPath: 'myTenantProp',
      tenantPathType: 'myTenantPathType',
    });

    const n1 = helper.getNode('n1') as IMimirTransferRequestNode;

    expect(n1).toHaveProperty('operation');
    expect(n1).toHaveProperty('output');
    expect(n1).toHaveProperty('tenantPath');
    expect(n1).toHaveProperty('tenantPathType');

    expect(n1.operation).toBe('getAll');
    expect(n1.output).toBe('myOutputProp');
    expect(n1.tenantPath).toBe('myTenantProp');
    expect(n1.tenantPathType).toBe('myTenantPathType');
  });

  describe('operations', () => {
    const { testErrorOutput, testSuccessOutput } = createTestOutputHelper(helper);
    const TEST_STORAGE_ID = 'm1m1r-570r463-1d';
    const mockedItems = Array.from({ length: 3 }).map((_, idx) => ({
      id: `m1m1r-7r4n5f3r-1d-${idx + 1}`,
      itemId: `m1m1r-173m-1d`,
      storageId: TEST_STORAGE_ID,
      originalFileName: `file${idx + 1}.png`,
      transferState: 'pending',
      artifact: 'highres',
      highresIsOffline: false,
      statusMessage: 'status',
      isProxy: false,
    })) as MimirTransferRequestModule.ITransferRequestItem[];

    it('should handle "getAll" operation', async () => {
      mockedGetAll.mockResolvedValue(mockedItems);

      await setupTest({ operation: 'getAll' });

      const n1 = helper.getNode('n1') as IMimirTransferRequestNode;
      const inputMessage = createInputMessage({ storageId: TEST_STORAGE_ID });

      n1.receive(inputMessage);

      expect(mockedGetAll).not.toHaveBeenCalled();
      await testSuccessOutput(async (_msg: unknown) => {
        expect(mockedGetAll).toHaveBeenCalledWith(TEST_STORAGE_ID);

        const msg = _msg as NodeMessageInFlow & { output: typeof mockedItems };
        expect(msg).toHaveProperty('output');
        expect(msg.output).toEqual(mockedItems);
      });
    });

    it('should handle "get" operation', async () => {
      const mockedItem = mockedItems[0];
      mockedGet.mockResolvedValue(mockedItem);

      await setupTest({ operation: 'get' });

      const n1 = helper.getNode('n1') as IMimirTransferRequestNode;
      const inputMessage = createInputMessage({ storageId: TEST_STORAGE_ID, transferRequestId: TEST_ITEM_ID });

      n1.receive(inputMessage);

      expect(mockedGet).not.toHaveBeenCalled();
      await testSuccessOutput(async (_msg: unknown) => {
        expect(mockedGet).toHaveBeenCalledWith(TEST_STORAGE_ID, TEST_ITEM_ID);

        const msg = _msg as NodeMessageInFlow & { output: typeof mockedItem };
        expect(msg).toHaveProperty('output');
        expect(msg.output).toEqual(mockedItem);
      });
    });

    it('should handle "create" operation', async () => {
      const mockedItem = mockedItems[0];
      mockedCreate.mockResolvedValue(mockedItem);

      await setupTest({ operation: 'create' });

      const n1 = helper.getNode('n1') as IMimirTransferRequestNode;
      const payload = { label: 'Item 1' };
      const inputMessage = createInputMessage({ storageId: TEST_STORAGE_ID, payload });

      n1.receive(inputMessage);

      expect(mockedCreate).not.toHaveBeenCalled();
      await testSuccessOutput(async (_msg: unknown) => {
        expect(mockedCreate).toHaveBeenCalledWith(TEST_STORAGE_ID, payload);

        const msg = _msg as NodeMessageInFlow & { output: typeof mockedItem };
        expect(msg).toHaveProperty('output');
        expect(msg.output).toEqual(mockedItem);
      });
    });

    it('should handle "update" operation', async () => {
      const mockedItem = { cutoffTime: 1 };
      mockedLock.mockResolvedValue(mockedItem);

      await setupTest({ operation: 'lock' });

      const n1 = helper.getNode('n1') as IMimirTransferRequestNode;
      const payload = { fields: [] };
      const inputMessage = createInputMessage({
        storageId: TEST_STORAGE_ID,
        transferRequestId: TEST_ITEM_ID,
        payload,
      });

      n1.receive(inputMessage);

      expect(mockedLock).not.toHaveBeenCalled();
      await testSuccessOutput(async (_msg: unknown) => {
        expect(mockedLock).toHaveBeenCalledWith(TEST_STORAGE_ID, TEST_ITEM_ID, payload);

        const msg = _msg as NodeMessageInFlow & { output: typeof mockedItem };
        expect(msg).toHaveProperty('output');
        expect(msg.output).toEqual(mockedItem);
      });
    });

    it('should handle "delete" operation', async () => {
      mockedDelete.mockResolvedValue('');

      await setupTest({ operation: 'delete' });

      const n1 = helper.getNode('n1') as IMimirTransferRequestNode;
      const payload = { transferState: 'pending' };
      const inputMessage = createInputMessage({
        storageId: TEST_STORAGE_ID,
        transferRequestId: TEST_ITEM_ID,
        payload,
      });

      n1.receive(inputMessage);

      expect(mockedDelete).not.toHaveBeenCalled();
      await testSuccessOutput(async (_msg: unknown) => {
        expect(mockedDelete).toHaveBeenCalledWith(TEST_STORAGE_ID, TEST_ITEM_ID, payload);

        const msg = _msg as NodeMessageInFlow & { output: string };
        expect(msg).toHaveProperty('output');
        expect(msg.output).toEqual('');
      });
    });

    it('should throw an error on invalid operation', async () => {
      // @ts-expect-error wrong type (testing purpose)
      await setupTest({ operation: 'invalidOperation' });
      const n1 = helper.getNode('n1') as IMimirTransferRequestNode;

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
      mockedGet.mockRejectedValue(TEST_ERROR_TEXT);

      await setupTest({ operation: 'get' });

      const n1 = helper.getNode('n1') as IMimirTransferRequestNode;
      const inputMessage = createInputMessage();

      n1.receive(inputMessage);

      await testErrorOutput(async (_msg: unknown) => {
        const msg = _msg as NodeMessageInFlow & { error: unknown };
        expect(msg).toHaveProperty('error');
        expect(msg.error).toEqual(TEST_ERROR_TEXT);
      });
    });
  });

  it('should throw an error if config is not found', async () => {
    const flow = [createTestMimirTransferRequestFlow({})];
    await helper.load([MimirHostNode, MimirTransferRequestNode], flow, createTestCredentials());
    const n1 = helper.getNode('n1') as IMimirTransferRequestNode;

    await new Promise(resolve => {
      // @ts-expect-error signature not declared
      n1.on('call:error', call => {
        call.should.be.calledWithExactly('No Mimir host config found!');
        resolve({});
      });
    });
  });

  async function setupTest(transferRequestFlowOptions: Partial<IMimirTransferRequestNodeConfig> = {}): Promise<void> {
    const flow = [
      { id: 'f1', type: 'tab', label: 'Test Flow' },
      createTestHostFlow(),
      createTestMimirTransferRequestFlow(transferRequestFlowOptions),
      { id: 'successNode', z: 'f1', type: 'helper' },
      { id: 'errorNode', z: 'f1', type: 'helper' },
    ];

    await helper.load([MimirHostNode, MimirTransferRequestNode], flow, createTestCredentials());
  }

  function createTestMimirTransferRequestFlow(
    options: Partial<IMimirTransferRequestNodeConfig>,
  ): TestFlowsItem<IMimirTransferRequestNodeConfig> {
    return {
      id: 'n1',
      z: 'f1',
      type: 'mimir-transferRequests',
      host: 'n0',
      operation: 'get',
      output: 'output',
      tenantPath: 'tenant',
      tenantPathType: 'msg',
      wires: [['successNode'], ['errorNode']],
      ...options,
    };
  }
});
