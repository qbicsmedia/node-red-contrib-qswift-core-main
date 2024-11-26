import helper, { TestFlowsItem } from 'node-red-node-test-helper';
import { SentimentType } from '@aws-sdk/client-comprehend';

import AWSConfigNode from '../../src/nodes/aws-config';
import AWSComprehendBatchSentimentNode, {
  IComprehendBatchSentimentNode,
  IComprehendBatchSentimentNodeConfig,
  IComprehendBatchSentimentNodeMessage,
} from '../../src/nodes/aws-comprehend-batch-sentiment';

import * as ComprehendClientModule from '../../src/lib/comprehendClient';

import { createAWSConfigTestSetup, createTestOutputHelper, TEST_ERROR_TEXT } from '../helper';

const mockedBatchDetectSentiment = jest.fn() as jest.MockedFunction<
  typeof ComprehendClientModule.AWSComprehendClient.prototype.batchDetectSentiment
>;

jest.mock<typeof import('../../src/lib/comprehendClient')>('../../src/lib/comprehendClient', () => {
  const originalModule = jest.requireActual<typeof import('../../src/lib/comprehendClient')>(
    '../../src/lib/comprehendClient',
  );

  return {
    ...originalModule,
    AWSComprehendClient: jest.fn().mockImplementation(() => {
      return {
        batchDetectSentiment: mockedBatchDetectSentiment,
      };
    }),
  };
});

helper.init(require.resolve('node-red'));

describe('aws-comprehend-batch-sentiment', () => {
  const { createTestHostFlow, createTestCredentials } = createAWSConfigTestSetup();
  const { testErrorOutput, testSuccessOutput } = createTestOutputHelper(helper);
  const zeroedSentimentScore = {
    Mixed: 0,
    Negative: 0,
    Neutral: 0,
    Positive: 0,
  };

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

    const n1 = helper.getNode('n1') as IComprehendBatchSentimentNode;

    expect(n1).toHaveProperty('languageCode');
    expect(n1).toHaveProperty('output');
    expect(n1).toHaveProperty('logging');

    expect(n1.languageCode).toBe('myLanguageCode');
    expect(n1.output).toBe('myOutputProp');
    expect(n1.logging).toBe(true);
  });

  it.each([
    {
      mockedResponse: {
        $metadata: {},
        ErrorList: [],
        ResultList: [
          {
            Sentiment: 'NEUTRAL' as SentimentType,
            SentimentScore: zeroedSentimentScore,
          },
        ],
      },
      expectedResult: {
        averageSentimentScore: zeroedSentimentScore,
        cumulatedSentimentScore: zeroedSentimentScore,
        resultList: [
          {
            Sentiment: 'NEUTRAL' as SentimentType,
            SentimentScore: zeroedSentimentScore,
          },
        ],
      },
    },
    {
      mockedResponse: {
        $metadata: {},
        ErrorList: [],
        ResultList: undefined,
      },
      expectedResult: {
        averageSentimentScore: zeroedSentimentScore,
        cumulatedSentimentScore: zeroedSentimentScore,
        resultList: [],
      },
    },
  ])('should forward result to success output', async ({ mockedResponse, expectedResult }) => {
    mockedBatchDetectSentiment.mockResolvedValue(mockedResponse);

    await setupTest();

    const n1 = helper.getNode('n1') as IComprehendBatchSentimentNode;

    n1.receive(createInputMessage());

    await testSuccessOutput(async (_msg: unknown) => {
      const msg = _msg as IComprehendBatchSentimentNodeMessage;
      expect(msg).toHaveProperty('output');
      expect(msg.output).toEqual(expectedResult);
    });
  });

  it('should forward error to error output', async () => {
    mockedBatchDetectSentiment.mockRejectedValue(TEST_ERROR_TEXT);

    await setupTest();

    const n1 = helper.getNode('n1') as IComprehendBatchSentimentNode;

    n1.receive(createInputMessage());

    await testErrorOutput(async (_msg: unknown) => {
      const msg = _msg as IComprehendBatchSentimentNodeMessage;
      expect(msg).toHaveProperty('error');
      expect(msg.error).toEqual(TEST_ERROR_TEXT);
    });
  });

  it('should show an error if config is not found', async () => {
    const flow = [createTestFlow({})];
    await helper.load([AWSConfigNode, AWSComprehendBatchSentimentNode], flow, createTestCredentials());
    const n1 = helper.getNode('n1') as IComprehendBatchSentimentNode;

    await new Promise(resolve => {
      // @ts-expect-error signature not declared
      n1.on('call:error', call => {
        call.should.be.calledWithExactly('No aws config found!');
        resolve({});
      });
    });
  });

  function createInputMessage(
    props: Partial<IComprehendBatchSentimentNodeMessage> = {},
  ): IComprehendBatchSentimentNodeMessage {
    return {
      _msgid: 'test-message-id',
      payload: ['hello', 'world', 'foo', 'bar', 'baz'],
      languageCode: 'en',
      ...props,
    };
  }

  async function setupTest(flowOptions: Partial<IComprehendBatchSentimentNodeConfig> = {}): Promise<void> {
    const flow = [
      { id: 'f1', type: 'tab', label: 'Test Flow' },
      createTestHostFlow(),
      createTestFlow(flowOptions),
      { id: 'successNode', z: 'f1', type: 'helper' },
      { id: 'errorNode', z: 'f1', type: 'helper' },
    ];

    await helper.load([AWSConfigNode, AWSComprehendBatchSentimentNode], flow, createTestCredentials());
  }

  function createTestFlow(
    options: Partial<IComprehendBatchSentimentNodeConfig>,
  ): TestFlowsItem<IComprehendBatchSentimentNodeConfig> {
    return {
      id: 'n1',
      z: 'f1',
      type: 'aws-comprehend-batch-sentiment',
      config: 'n0',
      languageCode: 'languageCode',
      output: 'output',
      logging: false,
      wires: [['successNode'], ['errorNode']],
      ...options,
    };
  }
});
