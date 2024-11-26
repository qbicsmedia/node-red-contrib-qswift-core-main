import { Node, NodeAPI, NodeDef, NodeMessage } from 'node-red';
import helper from 'node-red-node-test-helper';
import { AxiosError, AxiosHeaders } from 'axios';

import { evaluateTenant, handleError, handleSuccess } from '../../src/lib/api';
import { TEST_ERROR_TEXT } from '../helper';

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

describe('api.ts', () => {
  const TEST_NODE_TYPE = 'test-node';

  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(() => helper.stopServer(done));
  });

  describe('evaluateTenant', () => {
    it.each([
      { tenantPath: 'tenant', msg: { tenant: 'tenantMessage' }, expected: 'tenantMessage' },
      {
        tenantPath: 'somewhere.else',
        msg: { somewhere: { else: 'tenantSomewhereElse' } },
        expected: 'tenantSomewhereElse',
      },
      { tenantPath: 'nowhere.found', msg: {}, expected: undefined },
    ])('should evaluate correct tenant for path type "msg" ($tenantPath)', async ({ tenantPath, msg, expected }) => {
      const TestNode = createTestNode(TEST_NODE_TYPE);
      const flow = [{ id: 'n1', type: TEST_NODE_TYPE, tenantPath, tenantPathType: 'msg' }];

      await helper.load(TestNode, flow);
      const n1 = helper.getNode('n1') as ITenantPathNode;

      const tenant = await evaluateTenant(n1, msg);
      expect(tenant).toBe(expected);
    });

    it('should evaluate correct tenant for path type "flow"', async () => {
      const TestNode = createTestNode(TEST_NODE_TYPE);
      const flow = [
        { id: 'f1', type: 'tab' },
        { id: 'n1', z: 'f1', type: TEST_NODE_TYPE, tenantPath: 'tenant', tenantPathType: 'flow' },
      ];

      await helper.load(TestNode, flow);
      const n1 = helper.getNode('n1') as ITenantPathNode;
      n1.context().flow.set('tenant', 'tenantFlow');

      const tenant = await evaluateTenant(n1, {});
      expect(tenant).toBe('tenantFlow');
    });

    it('should evaluate correct tenant for path type "global"', async () => {
      const TestNode = createTestNode(TEST_NODE_TYPE);
      const flow = [
        { id: 'f1', type: 'tab' },
        { id: 'n1', z: 'f1', type: TEST_NODE_TYPE, tenantPath: 'tenant', tenantPathType: 'global' },
      ];

      await helper.load(TestNode, flow);
      const n1 = helper.getNode('n1') as ITenantPathNode;
      n1.context().global.set('tenant', 'tenantGlobal');

      const tenant = await evaluateTenant(n1, {});
      expect(tenant).toBe('tenantGlobal');
    });

    it('should throw an error if tenantPath is not a string', async () => {
      const TestNode = createTestNode(TEST_NODE_TYPE);
      const flow = [
        { id: 'f1', type: 'tab' },
        { id: 'n1', z: 'f1', type: TEST_NODE_TYPE, tenantPath: 1234, tenantPathType: 'flow' },
      ];

      await helper.load(TestNode, flow);
      const n1 = helper.getNode('n1') as ITenantPathNode;

      expect(async () => await evaluateTenant(n1, {})).rejects.toThrow('Invalid tenant path!');
    });
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
      const error = new Error(TEST_ERROR_TEXT);

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
