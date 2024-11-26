import helper, { TestFlowsItem } from 'node-red-node-test-helper';

import AWSConfigNode from '../../src/nodes/aws-config';
import AWSComprehendBatchEntitiesNode, {
  IComprehendBatchEntitiesNode,
  IComprehendBatchEntitiesNodeConfig,
  IComprehendBatchEntitiesNodeMessage,
} from '../../src/nodes/aws-comprehend-batch-entities';

import * as ComprehendClientModule from '../../src/lib/comprehendClient';

import { createAWSConfigTestSetup, createTestOutputHelper, TEST_ERROR_TEXT } from '../helper';

const mockedBatchDetectEntities = jest.fn() as jest.MockedFunction<
  typeof ComprehendClientModule.AWSComprehendClient.prototype.batchDetectEntities
>;

jest.mock<typeof import('../../src/lib/comprehendClient')>('../../src/lib/comprehendClient', () => {
  const originalModule = jest.requireActual<typeof import('../../src/lib/comprehendClient')>(
    '../../src/lib/comprehendClient',
  );

  return {
    ...originalModule,
    AWSComprehendClient: jest.fn().mockImplementation(() => {
      return {
        batchDetectEntities: mockedBatchDetectEntities,
      };
    }),
  };
});

helper.init(require.resolve('node-red'));

describe('aws-comprehend-batch-entities', () => {
  const { createTestHostFlow, createTestCredentials } = createAWSConfigTestSetup();
  const { testErrorOutput, testSuccessOutput } = createTestOutputHelper(helper);

  beforeEach(function (done) {
    helper.startServer(done);
  });

  afterEach(function (done) {
    helper.unload().then(() => helper.stopServer(done));
  });

  it('should have configured properties', async () => {
    await setupTest({
      languageCode: 'myLanguageCode',
      output: 'myOutputProp',
      logging: true,
    });

    const n1 = helper.getNode('n1') as IComprehendBatchEntitiesNode;

    expect(n1).toHaveProperty('languageCode');
    expect(n1).toHaveProperty('output');
    expect(n1).toHaveProperty('logging');

    expect(n1.languageCode).toBe('myLanguageCode');
    expect(n1.output).toBe('myOutputProp');
    expect(n1.logging).toBe(true);
  });

  it.each([
    {
      resultList: [{ Entities: [{ Score: 1, Text: 'some text' }] }],
      expectedResult: [{ Score: 1, Text: 'some text' }],
    },
    { resultList: [], expectedResult: [] },
    { resultList: [{ Entities: [] }], expectedResult: [] },
    { resultList: undefined, expectedResult: [] },
  ])('should forward result to success output', async ({ resultList, expectedResult }) => {
    mockedBatchDetectEntities.mockResolvedValue({
      $metadata: {},
      ResultList: resultList,
      ErrorList: [],
    });

    await setupTest();

    const n1 = helper.getNode('n1') as IComprehendBatchEntitiesNode;

    n1.receive(createInputMessage());

    await testSuccessOutput(async (_msg: unknown) => {
      const msg = _msg as IComprehendBatchEntitiesNodeMessage;
      expect(msg).toHaveProperty('output');
      expect(msg.output).toEqual(expectedResult);
    });
  });

  it('should forward error to error output', async () => {
    mockedBatchDetectEntities.mockRejectedValue(TEST_ERROR_TEXT);

    await setupTest();

    const n1 = helper.getNode('n1') as IComprehendBatchEntitiesNode;

    n1.receive(createInputMessage());

    await testErrorOutput(async (_msg: unknown) => {
      const msg = _msg as IComprehendBatchEntitiesNodeMessage;
      expect(msg).toHaveProperty('error');
      expect(msg.error).toEqual(TEST_ERROR_TEXT);
    });
  });

  it('should show an error if config is not found', async () => {
    const flow = [createTestFlow({})];
    await helper.load([AWSConfigNode, AWSComprehendBatchEntitiesNode], flow, createTestCredentials());
    const n1 = helper.getNode('n1') as IComprehendBatchEntitiesNode;

    await new Promise(resolve => {
      // @ts-expect-error signature not declared
      n1.on('call:error', call => {
        call.should.be.calledWithExactly('No aws config found!');
        resolve({});
      });
    });
  });

  function createInputMessage(
    props: Partial<IComprehendBatchEntitiesNodeMessage> = {},
  ): IComprehendBatchEntitiesNodeMessage {
    return {
      _msgid: 'test-message-id',
      payload: ['hello', 'world', 'foo', 'bar', 'baz'],
      languageCode: 'en',
      ...props,
    };
  }

  async function setupTest(flowOptions: Partial<IComprehendBatchEntitiesNodeConfig> = {}): Promise<void> {
    const flow = [
      { id: 'f1', type: 'tab', label: 'Test Flow' },
      createTestHostFlow(),
      createTestFlow(flowOptions),
      { id: 'successNode', z: 'f1', type: 'helper' },
      { id: 'errorNode', z: 'f1', type: 'helper' },
    ];

    await helper.load([AWSConfigNode, AWSComprehendBatchEntitiesNode], flow, createTestCredentials());
  }

  function createTestFlow(
    options: Partial<IComprehendBatchEntitiesNodeConfig>,
  ): TestFlowsItem<IComprehendBatchEntitiesNodeConfig> {
    return {
      id: 'n1',
      z: 'f1',
      type: 'aws-comprehend-batch-entities',
      config: 'n0',
      languageCode: 'languageCode',
      output: 'output',
      logging: false,
      wires: [['successNode'], ['errorNode']],
      ...options,
    };
  }
});
