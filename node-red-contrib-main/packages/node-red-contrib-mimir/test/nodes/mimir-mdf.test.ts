import helper, { TestFlowsItem } from 'node-red-node-test-helper';
import { NodeMessageInFlow } from 'node-red';

import MimirHostNode from '../../src/nodes/mimir-host';
import MimirMdfNode, { IMimirMdfNode, IMimirMdfNodeConfig } from '../../src/nodes/mimir-mdf';

import * as MimirMdfRequestModule from '../../src/lib/MimirMdfRequest';

import { createApiRequestTestSetup, createTestOutputHelper, TEST_ERROR_TEXT, TEST_ITEM_ID } from '../helper';

const requestProto = MimirMdfRequestModule.MimirMdfRequest.prototype;
const mockedRetrieveAll = jest.fn() as jest.MockedFunction<typeof requestProto.retrieveAll>;
const mockedRetrieve = jest.fn() as jest.MockedFunction<typeof requestProto.retrieve>;
const mockedCreate = jest.fn() as jest.MockedFunction<typeof requestProto.create>;
const mockedUpdate = jest.fn() as jest.MockedFunction<typeof requestProto.update>;
const mockedDelete = jest.fn() as jest.MockedFunction<typeof requestProto.delete>;

jest.mock<typeof import('../../src/lib/MimirMdfRequest')>('../../src/lib/MimirMdfRequest', () => {
  return {
    MimirMdfRequest: jest.fn().mockImplementation(() => {
      return {
        retrieveAll: mockedRetrieveAll,
        retrieve: mockedRetrieve,
        create: mockedCreate,
        update: mockedUpdate,
        delete: mockedDelete,
      };
    }),
  };
});

helper.init(require.resolve('node-red'));

describe('mimir-mdf', () => {
  const { createInputMessage, createTestHostFlow, createTestCredentials } = createApiRequestTestSetup();

  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(() => helper.stopServer(done));
  });

  it('should have configured properties', async () => {
    await setupTest({
      operation: 'retrieve',
      output: 'myOutputProp',
      tenantPath: 'myTenantProp',
      tenantPathType: 'myTenantPathType',
      verboseLogging: true,
    });

    const n1 = helper.getNode('n1') as IMimirMdfNode;

    expect(n1).toHaveProperty('operation');
    expect(n1).toHaveProperty('output');
    expect(n1).toHaveProperty('tenantPath');
    expect(n1).toHaveProperty('tenantPathType');
    expect(n1).toHaveProperty('verboseLogging');

    expect(n1.operation).toBe('retrieve');
    expect(n1.output).toBe('myOutputProp');
    expect(n1.tenantPath).toBe('myTenantProp');
    expect(n1.tenantPathType).toBe('myTenantPathType');
    expect(n1.verboseLogging).toBe(true);
  });

  describe('operations', () => {
    const { testErrorOutput, testSuccessOutput } = createTestOutputHelper(helper);
    const mockedItems = [
      { id: 'm1m1r-173m-1d-1', label: 'Item 1' },
      { id: 'm1m1r-173m-1d-2', label: 'Item 2' },
      { id: 'm1m1r-173m-1d-3', label: 'Item 3' },
    ] as MimirMdfRequestModule.IMdfItem[];

    it('should handle "retrieveAll" operation', async () => {
      mockedRetrieveAll.mockResolvedValue(mockedItems);

      await setupTest({ operation: 'retrieveAll' });

      const n1 = helper.getNode('n1') as IMimirMdfNode;
      const inputMessage = createInputMessage();

      n1.receive(inputMessage);

      expect(mockedRetrieveAll).not.toHaveBeenCalled();
      await testSuccessOutput(async (_msg: unknown) => {
        expect(mockedRetrieveAll).toHaveBeenCalledWith();

        const msg = _msg as NodeMessageInFlow & { output: typeof mockedItems };
        expect(msg).toHaveProperty('output');
        expect(msg.output).toEqual(mockedItems);
      });
    });

    it('should handle "retrieve" operation', async () => {
      const mockedItem = mockedItems[0];
      mockedRetrieve.mockResolvedValue(mockedItem);

      await setupTest({ operation: 'retrieve' });

      const n1 = helper.getNode('n1') as IMimirMdfNode;
      const inputMessage = createInputMessage({ mdfId: TEST_ITEM_ID });

      n1.receive(inputMessage);

      expect(mockedRetrieve).not.toHaveBeenCalled();
      await testSuccessOutput(async (_msg: unknown) => {
        expect(mockedRetrieve).toHaveBeenCalledWith(TEST_ITEM_ID);

        const msg = _msg as NodeMessageInFlow & { output: typeof mockedItem };
        expect(msg).toHaveProperty('output');
        expect(msg.output).toEqual(mockedItem);
      });
    });

    it('should handle "create" operation', async () => {
      const mockedItem = mockedItems[0];
      mockedCreate.mockResolvedValue(mockedItem);

      await setupTest({ operation: 'create' });

      const n1 = helper.getNode('n1') as IMimirMdfNode;
      const payload = { label: 'Item 1' };
      const inputMessage = createInputMessage({ payload });

      n1.receive(inputMessage);

      expect(mockedCreate).not.toHaveBeenCalled();
      await testSuccessOutput(async (_msg: unknown) => {
        expect(mockedCreate).toHaveBeenCalledWith(payload);

        const msg = _msg as NodeMessageInFlow & { output: typeof mockedItem };
        expect(msg).toHaveProperty('output');
        expect(msg.output).toEqual(mockedItem);
      });
    });

    it('should handle "update" operation', async () => {
      const mockedItem = mockedItems[0];
      mockedUpdate.mockResolvedValue(mockedItem);

      await setupTest({ operation: 'update' });

      const n1 = helper.getNode('n1') as IMimirMdfNode;
      const payload = { fields: [] };
      const inputMessage = createInputMessage({
        mdfId: TEST_ITEM_ID,
        payload,
      });

      n1.receive(inputMessage);

      expect(mockedUpdate).not.toHaveBeenCalled();
      await testSuccessOutput(async (_msg: unknown) => {
        expect(mockedUpdate).toHaveBeenCalledWith(TEST_ITEM_ID, payload);

        const msg = _msg as NodeMessageInFlow & { output: typeof mockedItem };
        expect(msg).toHaveProperty('output');
        expect(msg.output).toEqual(mockedItem);
      });
    });

    it('should handle "delete" operation', async () => {
      mockedDelete.mockResolvedValue('');

      await setupTest({ operation: 'delete' });

      const n1 = helper.getNode('n1') as IMimirMdfNode;
      const inputMessage = createInputMessage({ mdfId: TEST_ITEM_ID });

      n1.receive(inputMessage);

      expect(mockedDelete).not.toHaveBeenCalled();
      await testSuccessOutput(async (_msg: unknown) => {
        expect(mockedDelete).toHaveBeenCalledWith(TEST_ITEM_ID);

        const msg = _msg as NodeMessageInFlow & { output: string };
        expect(msg).toHaveProperty('output');
        expect(msg.output).toEqual('');
      });
    });

    it('should throw an error on invalid operation', async () => {
      // @ts-expect-error wrong type (testing purpose)
      await setupTest({ operation: 'invalidOperation' });
      const n1 = helper.getNode('n1') as IMimirMdfNode;

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
      mockedRetrieve.mockRejectedValue(TEST_ERROR_TEXT);

      await setupTest({ operation: 'retrieve' });

      const n1 = helper.getNode('n1') as IMimirMdfNode;
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
    const flow = [createTestMimirMdfFlow({})];
    await helper.load([MimirHostNode, MimirMdfNode], flow, createTestCredentials());
    const n1 = helper.getNode('n1') as IMimirMdfNode;

    await new Promise(resolve => {
      // @ts-expect-error signature not declared
      n1.on('call:error', call => {
        call.should.be.calledWithExactly('No Mimir host config found!');
        resolve({});
      });
    });
  });

  async function setupTest(mdfFlowOptions: Partial<IMimirMdfNodeConfig> = {}): Promise<void> {
    const flow = [
      { id: 'f1', type: 'tab', label: 'Test Flow' },
      createTestHostFlow(),
      createTestMimirMdfFlow(mdfFlowOptions),
      { id: 'successNode', z: 'f1', type: 'helper' },
      { id: 'errorNode', z: 'f1', type: 'helper' },
    ];

    await helper.load([MimirHostNode, MimirMdfNode], flow, createTestCredentials());
  }

  function createTestMimirMdfFlow(options: Partial<IMimirMdfNodeConfig>): TestFlowsItem<IMimirMdfNodeConfig> {
    return {
      id: 'n1',
      z: 'f1',
      type: 'mimir-mdf',
      host: 'n0',
      operation: 'retrieve',
      output: 'output',
      tenantPath: 'tenant',
      tenantPathType: 'msg',
      verboseLogging: false,
      wires: [['successNode'], ['errorNode']],
      ...options,
    };
  }
});
