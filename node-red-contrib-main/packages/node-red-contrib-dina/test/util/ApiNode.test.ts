import { handleError, handleSuccess } from '@dina/util/ApiNode';
import { AxiosError, AxiosHeaders } from 'axios';
import { Node, NodeAPI, NodeDef, NodeMessage } from 'node-red';
import helper from 'node-red-node-test-helper';

const TEST_ERROR_TEXT = 'THIS IS AN INTENTIONAL ERROR';

helper.init(require.resolve('node-red'));

type TTenantPathTypes = 'msg' | 'flow' | 'global';

interface ITenantPathNode extends Node {
  tenantPath: string;
  tenantPathType: TTenantPathTypes;
}

interface ITenantPathNodeConfig extends NodeDef {
  tenantPath: string;
  tenantPathType: TTenantPathTypes;
}

function createTestNode(type: string = 'test-node'): (RED: NodeAPI) => void {
  return function (RED: NodeAPI): void {
    function TestNode(this: ITenantPathNode, config: ITenantPathNodeConfig): void {
      RED.nodes.createNode(this, config);

      this.tenantPath = config.tenantPath;
      this.tenantPathType = config.tenantPathType;
    }

    RED.nodes.registerType(type, TestNode);
  };
}

describe('ApiNode.ts', () => {
  const TEST_NODE_TYPE = 'test-node';

  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(() => helper.stopServer(done));
  });

  describe('handleSuccess', () => {
    it('should forward data', async () => {
      await setupSimpleTestNode();

      const n1 = helper.getNode('n1');
      const result = handleSuccess(n1, {}, 'output')('hello');

      expect(result).toEqual('hello');
      expect(typeof result).toEqual('string');
    });

    it('should assign data to given property', async () => {
      await setupSimpleTestNode();

      const n1 = helper.getNode('n1');
      const msg = {};

      expect(msg).not.toHaveProperty('output');
      handleSuccess(n1, msg, 'output')('hello');
      expect(msg).toHaveProperty('output');
    });

    it('should assign data to default property "payload" if not specified', async () => {
      await setupSimpleTestNode();

      const n1 = helper.getNode('n1');
      const msg = {};

      expect(msg).not.toHaveProperty('payload');
      handleSuccess(n1, msg)('hello');
      expect(msg).toHaveProperty('payload');
    });

    it('should send message with assigned data through first output', async () => {
      await setupSimpleTestNode();

      const n1 = helper.getNode('n1');
      const sendSpy = jest.spyOn(n1, 'send');
      const msg = {};

      handleSuccess(n1, msg, 'output')('hello');
      expect(sendSpy).toHaveBeenCalledWith([{ output: 'hello' }, null]);
    });
  });

  describe('handleError', () => {
    it('should send message with error through second output', async () => {
      await setupSimpleTestNode();

      const n1 = helper.getNode('n1');
      const sendSpy = jest.spyOn(n1, 'send');
      const msg: { error?: AxiosError | Error } = {};
      const error = new Error('THIS IS AN INTENTIONAL ERROR');

      handleError(n1, msg)(error);
      expect(sendSpy).toHaveBeenCalledWith([null, msg]);
      expect(msg).toHaveProperty('error');
      expect(msg.error).toEqual(error);
    });

    it('should log error', async () => {
      const { n1, errorSpy, msg, error } = await setupHandleErrorTest();

      expect(errorSpy).not.toHaveBeenCalled();
      handleError(n1, msg)(error);
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should log axios error', async () => {
      const { n1, errorSpy, msg } = await setupHandleErrorTest();
      const fakeAxiosError = new AxiosError('TEST ERROR MESSAGE', '418');

      expect(errorSpy).not.toHaveBeenCalled();
      handleError(n1, msg)(fakeAxiosError);
      expect(errorSpy).toHaveBeenCalled();
    });

    interface ISetupHandleErrorTestResult {
      n1: Node;
      sendSpy: jest.SpyInstance;
      errorSpy: jest.SpyInstance;
      msg: NodeMessage & { error?: AxiosError | Error };
      error: Error;
    }

    async function setupHandleErrorTest(): Promise<ISetupHandleErrorTestResult> {
      await setupSimpleTestNode();

      const n1 = helper.getNode('n1');
      const sendSpy = jest.spyOn(n1, 'send');
      const errorSpy = jest.spyOn(n1, 'error');
      const msg: { error?: AxiosError | Error } = {};
      const error = new Error(TEST_ERROR_TEXT);

      return {
        n1,
        sendSpy,
        errorSpy,
        msg,
        error,
      };
    }
  });

  describe('logApiError', () => {
    it('should log axios error', async () => {
      await setupSimpleTestNode();

      const n1 = helper.getNode('n1');
      const errorSpy = jest.spyOn(n1, 'error');
      const msg: { error?: AxiosError | Error } = {};
      const fakeAxiosError = new AxiosError('TEST ERROR MESSAGE', '418', {
        method: 'GET',
        url: 'https://url.to/nowhere',
        data: 'some data',
        headers: new AxiosHeaders(),
      });
      fakeAxiosError.response = {
        status: 418,
        headers: new AxiosHeaders(),
        data: 'some response data',
        statusText: 'Some status text',
        config: {
          headers: new AxiosHeaders(),
        },
      };

      expect(errorSpy).not.toHaveBeenCalled();
      handleError(n1, msg)(fakeAxiosError);
      expect(errorSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(`GET https://url.to/nowhere 418\n"some data"`);
    });

    it('should log error (thrown error)', async () => {
      await setupSimpleTestNode();

      const n1 = helper.getNode('n1');
      const errorSpy = jest.spyOn(n1, 'error');
      const msg: { error?: AxiosError | Error } = {};
      const error = new Error(TEST_ERROR_TEXT);

      expect(errorSpy).not.toHaveBeenCalled();
      handleError(n1, msg)(error);
      expect(errorSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining(TEST_ERROR_TEXT));
    });

    it('should log error (error text)', async () => {
      await setupSimpleTestNode();

      const n1 = helper.getNode('n1');
      const errorSpy = jest.spyOn(n1, 'error');
      const msg: { error?: AxiosError | Error } = {};

      expect(errorSpy).not.toHaveBeenCalled();
      // @ts-expect-error wrong type (testing purpose)
      handleError(n1, msg)({ message: TEST_ERROR_TEXT });
      expect(errorSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining(TEST_ERROR_TEXT));
    });
  });

  async function setupSimpleTestNode(): Promise<void> {
    const TestNode = createTestNode(TEST_NODE_TYPE);
    const flow = [{ id: 'n1', type: TEST_NODE_TYPE }];

    await helper.load(TestNode, flow);
  }
});
