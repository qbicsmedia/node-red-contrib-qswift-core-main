import NodeTestHelper, { TestFlowsItem } from 'node-red-node-test-helper';

import { IMimirApiRequestOptions, MimirApiRequest } from '../src/lib/MimirApiRequest';
import { MimirApiRequestConfig } from '../src/lib/MimirApiRequestConfig';

import { IMimirHostNodeConfig } from '../src/nodes/mimir-host';

export const TEST_ITEM_ID = 'm1m1r-173m-1d';
export const TEST_ERROR_TEXT = 'THIS IS AN INTENTIONAL ERROR';
export const TEST_BASE_URL = 'https://base-url.local';
export const TEST_CUSTOM_URL_1 = 'https://tenant1.local';
export const TEST_CUSTOM_URL_2 = 'https://tenant2.local';
export const TEST_CUSTOM_BASE_URLS = [
  { tenantName: 'tenant1', baseUrl: TEST_CUSTOM_URL_1 },
  { tenantName: 'tenant2', baseUrl: TEST_CUSTOM_URL_2 },
];
export const TEST_TENANTS = [
  { name: 'tenant1', apiKey: 'apiKey1' },
  { name: 'tenant2', apiKey: 'apiKey2' },
  { name: 'tenant3', apiKey: 'apiKey3' },
];
export const TEST_DEFAULT_TENANT_NAME = 'tenant3';
export const TEST_DEFAULT_TENANT_API_KEY = 'apiKey3';

export function createRequestInstance<T extends MimirApiRequest>(
  ctor: { new (config: MimirApiRequestConfig, options: IMimirApiRequestOptions): T },
  options: IMimirApiRequestOptions = { tenant: TEST_DEFAULT_TENANT_NAME },
): T {
  const config = new MimirApiRequestConfig({
    baseUrl: TEST_BASE_URL,
    tokenList: TEST_TENANTS,
    customBaseUrls: TEST_CUSTOM_BASE_URLS,
  });
  return new ctor(config, options);
}

export function createRequestHeaders(
  headers: { [key: string]: unknown } = {},
  apiKey: string = TEST_DEFAULT_TENANT_API_KEY,
): { [key: string]: unknown } {
  return {
    'x-mimir-cognito-id-token': `Bearer ${apiKey}`,
    ...headers,
  };
}

interface ICreateTestOutputHelperOutput {
  testSuccessOutput: (fn: (msg: unknown) => Promise<void>) => Promise<void>;
  testErrorOutput: (fn: (msg: unknown) => Promise<void>) => Promise<void>;
}

export function createTestOutputHelper(helper: typeof NodeTestHelper): ICreateTestOutputHelperOutput {
  async function testSuccessOutput(fn: (msg: unknown) => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      const errorNode = helper.getNode('errorNode');
      const successNode = helper.getNode('successNode');

      successNode.on('input', async (msg: unknown) => {
        try {
          await fn(msg);
          resolve();
        } catch (err) {
          reject(err);
        }
      });

      errorNode.on('input', () => {
        throw new Error('Test should not reach error output!');
      });
    });
  }

  async function testErrorOutput(fn: (msg: unknown) => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      const errorNode = helper.getNode('errorNode');
      const successNode = helper.getNode('successNode');

      successNode.on('input', () => {
        throw new Error('Test should not reach success output!');
      });

      errorNode.on('input', async (msg: unknown) => {
        try {
          await fn(msg);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  return {
    testSuccessOutput,
    testErrorOutput,
  };
}

interface ICreateApiRequestTestSetupOutput {
  createTestHostFlow: () => TestFlowsItem<IMimirHostNodeConfig>;
  createTestCredentials: (configNodeId?: string) => { [key: string]: unknown };
  createInputMessage: (props?: Record<string, unknown>) => Record<string, unknown>;
}

export function createApiRequestTestSetup(): ICreateApiRequestTestSetupOutput {
  function createTestHostFlow(): TestFlowsItem<IMimirHostNodeConfig> {
    return {
      id: 'n0',
      z: 'f1',
      type: 'mimir-host',
      name: 'Mimir Config',
      baseUrl: TEST_BASE_URL,
      customBaseUrls: TEST_CUSTOM_BASE_URLS,
    };
  }

  function createTestCredentials(configNodeId: string = 'n0'): { [key: string]: unknown } {
    return {
      [configNodeId]: {
        tenants: TEST_TENANTS,
      },
    };
  }

  function createInputMessage(props: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      tenant: TEST_DEFAULT_TENANT_NAME,
      ...props,
    };
  }

  return {
    createTestHostFlow,
    createTestCredentials,
    createInputMessage,
  };
}
