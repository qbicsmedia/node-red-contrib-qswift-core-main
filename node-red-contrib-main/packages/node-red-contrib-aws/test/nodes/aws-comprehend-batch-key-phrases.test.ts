import helper, { TestFlowsItem } from 'node-red-node-test-helper';

import AWSConfigNode from '../../src/nodes/aws-config';
import AWSComprehendBatchKeyPhrasesNode, {
  IComprehendBatchKeyPhrasesNode,
  IComprehendBatchKeyPhrasesNodeConfig,
  IComprehendBatchKeyPhrasesNodeMessage,
} from '../../src/nodes/aws-comprehend-batch-key-phrases';

import * as ComprehendClientModule from '../../src/lib/comprehendClient';

import { createAWSConfigTestSetup, createTestOutputHelper, TEST_ERROR_TEXT } from '../helper';

const mockedBatchDetectKeyPhrases = jest.fn() as jest.MockedFunction<
  typeof ComprehendClientModule.AWSComprehendClient.prototype.batchDetectKeyPhrases
>;

jest.mock<typeof import('../../src/lib/comprehendClient')>('../../src/lib/comprehendClient', () => {
  const originalModule = jest.requireActual<typeof import('../../src/lib/comprehendClient')>(
    '../../src/lib/comprehendClient',
  );

  return {
    ...originalModule,
    AWSComprehendClient: jest.fn().mockImplementation(() => {
      return {
        batchDetectKeyPhrases: mockedBatchDetectKeyPhrases,
      };
    }),
  };
});

helper.init(require.resolve('node-red'));

describe('aws-comprehend-batch-key-phrases', () => {
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

    const n1 = helper.getNode('n1') as IComprehendBatchKeyPhrasesNode;

    expect(n1).toHaveProperty('languageCode');
    expect(n1).toHaveProperty('output');
    expect(n1).toHaveProperty('logging');

    expect(n1.languageCode).toBe('myLanguageCode');
    expect(n1.output).toBe('myOutputProp');
    expect(n1.logging).toBe(true);
  });

  it.each([
    {
      resultList: [{ KeyPhrases: [{ Score: 1, Text: 'some text', BeginOffset: 10, EndOffset: 19 }] }],
      expectedResult: [{ Score: 1, Text: 'some text', BeginOffset: 10, EndOffset: 19 }],
    },
    { resultList: [], expectedResult: [] },
    { resultList: [{ KeyPhrases: [] }], expectedResult: [] },
    { resultList: undefined, expectedResult: [] },
  ])('should forward result to success output', async ({ resultList, expectedResult }) => {
    mockedBatchDetectKeyPhrases.mockResolvedValue({
      $metadata: {},
      ResultList: resultList,
      ErrorList: [],
    });

    await setupTest();

    const n1 = helper.getNode('n1') as IComprehendBatchKeyPhrasesNode;

    n1.receive(createInputMessage());

    await testSuccessOutput(async (_msg: unknown) => {
      const msg = _msg as IComprehendBatchKeyPhrasesNodeMessage;
      expect(msg).toHaveProperty('output');
      expect(msg.output).toEqual(expectedResult);
    });
  });

  it('should forward error to error output', async () => {
    mockedBatchDetectKeyPhrases.mockRejectedValue(TEST_ERROR_TEXT);

    await setupTest();

    const n1 = helper.getNode('n1') as IComprehendBatchKeyPhrasesNode;

    n1.receive(createInputMessage());

    await testErrorOutput(async (_msg: unknown) => {
      const msg = _msg as IComprehendBatchKeyPhrasesNodeMessage;
      expect(msg).toHaveProperty('error');
      expect(msg.error).toEqual(TEST_ERROR_TEXT);
    });
  });

  it('should show an error if config is not found', async () => {
    const flow = [createTestFlow({})];
    await helper.load([AWSConfigNode, AWSComprehendBatchKeyPhrasesNode], flow, createTestCredentials());
    const n1 = helper.getNode('n1') as IComprehendBatchKeyPhrasesNode;

    await new Promise(resolve => {
      // @ts-expect-error signature not declared
      n1.on('call:error', call => {
        call.should.be.calledWithExactly('No aws config found!');
        resolve({});
      });
    });
  });

  function createInputMessage(
    props: Partial<IComprehendBatchKeyPhrasesNodeMessage> = {},
  ): IComprehendBatchKeyPhrasesNodeMessage {
    return {
      _msgid: 'test-message-id',
      payload: ['hello', 'world', 'foo', 'bar', 'baz'],
      languageCode: 'en',
      ...props,
    };
  }

  async function setupTest(flowOptions: Partial<IComprehendBatchKeyPhrasesNodeConfig> = {}): Promise<void> {
    const flow = [
      { id: 'f1', type: 'tab', label: 'Test Flow' },
      createTestHostFlow(),
      createTestFlow(flowOptions),
      { id: 'successNode', z: 'f1', type: 'helper' },
      { id: 'errorNode', z: 'f1', type: 'helper' },
    ];

    await helper.load([AWSConfigNode, AWSComprehendBatchKeyPhrasesNode], flow, createTestCredentials());
  }

  function createTestFlow(
    options: Partial<IComprehendBatchKeyPhrasesNodeConfig>,
  ): TestFlowsItem<IComprehendBatchKeyPhrasesNodeConfig> {
    return {
      id: 'n1',
      z: 'f1',
      type: 'aws-comprehend-batch-key-phrases',
      config: 'n0',
      languageCode: 'languageCode',
      output: 'output',
      logging: false,
      wires: [['successNode'], ['errorNode']],
      ...options,
    };
  }
});
