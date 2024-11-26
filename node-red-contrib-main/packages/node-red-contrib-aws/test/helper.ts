import NodeTestHelper, { TestFlowsItem } from 'node-red-node-test-helper';

import { IAWSConfigNodeConfig } from '../src/nodes/aws-config';

export const TEST_ERROR_TEXT = 'THIS IS AN INTENTIONAL ERROR';

interface ICreateAWSConfigTestSetupOutput {
  createTestHostFlow: () => TestFlowsItem<IAWSConfigNodeConfig>;
  createTestCredentials: (configNodeId?: string) => { [key: string]: unknown };
}

export function createAWSConfigTestSetup(): ICreateAWSConfigTestSetupOutput {
  function createTestHostFlow(): TestFlowsItem<IAWSConfigNodeConfig> {
    return {
      id: 'n0',
      z: 'f1',
      type: 'aws-config',
      name: 'AWS Config',
      region: 'myRegion',
      authType: 'CREDENTIALS',
    };
  }

  function createTestCredentials(configNodeId: string = 'n0'): { [key: string]: unknown } {
    return {
      [configNodeId]: {
        accessKeyId: 'myAccessKeyId',
        secretAccessKey: 'mySecretAccessKey',
        assumeRoleArn: 'myAssumeRoleArn',
      },
    };
  }

  return {
    createTestHostFlow,
    createTestCredentials,
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
