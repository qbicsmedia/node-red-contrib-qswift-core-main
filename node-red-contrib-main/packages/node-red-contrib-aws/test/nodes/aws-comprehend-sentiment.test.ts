import helper, { TestFlowsItem } from 'node-red-node-test-helper';

import AWSConfigNode from '../../src/nodes/aws-config';
import AWSComprehendSentimentNode, {
  IComprehendSentimentNode,
  IComprehendSentimentNodeConfig,
  IComprehendSentimentNodeMessage,
} from '../../src/nodes/aws-comprehend-sentiment';

import * as ComprehendClientModule from '../../src/lib/comprehendClient';

import { createAWSConfigTestSetup, createTestOutputHelper, TEST_ERROR_TEXT } from '../helper';

const mockedDetectSentiment = jest.fn() as jest.MockedFunction<
  typeof ComprehendClientModule.AWSComprehendClient.prototype.detectSentiment
>;

jest.mock<typeof import('../../src/lib/comprehendClient')>('../../src/lib/comprehendClient', () => {
  const originalModule = jest.requireActual<typeof import('../../src/lib/comprehendClient')>(
    '../../src/lib/comprehendClient',
  );

  return {
    ...originalModule,
    AWSComprehendClient: jest.fn().mockImplementation(() => {
      return {
        detectSentiment: mockedDetectSentiment,
      };
    }),
  };
});

helper.init(require.resolve('node-red'));

describe('aws-comprehend-sentiment', () => {
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

    const n1 = helper.getNode('n1') as IComprehendSentimentNode;

    expect(n1).toHaveProperty('languageCode');
    expect(n1).toHaveProperty('output');
    expect(n1).toHaveProperty('logging');

    expect(n1.languageCode).toBe('myLanguageCode');
    expect(n1.output).toBe('myOutputProp');
    expect(n1.logging).toBe(true);
  });

  it('should forward result to success output', async () => {
    mockedDetectSentiment.mockResolvedValue({ Sentiment: 'NEUTRAL', SentimentScore: {}, $metadata: {} });

    await setupTest();

    const n1 = helper.getNode('n1') as IComprehendSentimentNode;

    n1.receive(createInputMessage());

    await testSuccessOutput(async (_msg: unknown) => {
      const msg = _msg as IComprehendSentimentNodeMessage;
      expect(msg).toHaveProperty('output');
      expect(msg.output).toEqual({ Sentiment: 'NEUTRAL', SentimentScore: {} });
    });
  });

  it.each([
    { text: '' },
    { text: 1234 },
    { text: true },
    { text: [] },
    { text: {} },
    { text: null },
    { text: undefined },
  ])('should throw an error if payload is no text ($text)', async ({ text }) => {
    await setupTest();

    const n1 = helper.getNode('n1') as IComprehendSentimentNode;

    // @ts-expect-error wrong type (testing purpose)
    n1.receive(createInputMessage({ payload: text }));

    await testErrorOutput(async (_msg: unknown) => {
      const msg = _msg as IComprehendSentimentNodeMessage;
      expect(msg).toHaveProperty('error');
      expect(msg.error).toEqual(
        expect.objectContaining({ message: expect.stringContaining('No text as payload found.') }),
      );
    });
  });

  it('should forward error to error output', async () => {
    mockedDetectSentiment.mockRejectedValue(TEST_ERROR_TEXT);

    await setupTest();

    const n1 = helper.getNode('n1') as IComprehendSentimentNode;

    n1.receive(createInputMessage());

    await testErrorOutput(async (_msg: unknown) => {
      const msg = _msg as IComprehendSentimentNodeMessage;
      expect(msg).toHaveProperty('error');
      expect(msg.error).toEqual(TEST_ERROR_TEXT);
    });
  });

  it('should show an error if config is not found', async () => {
    const flow = [createTestFlow({})];
    await helper.load([AWSConfigNode, AWSComprehendSentimentNode], flow, createTestCredentials());
    const n1 = helper.getNode('n1') as IComprehendSentimentNode;

    await new Promise(resolve => {
      // @ts-expect-error signature not declared
      n1.on('call:error', call => {
        call.should.be.calledWithExactly('No aws config found!');
        resolve({});
      });
    });
  });

  function createInputMessage(props: Partial<IComprehendSentimentNodeMessage> = {}): IComprehendSentimentNodeMessage {
    return {
      _msgid: 'test-message-id',
      payload: 'hello world foo bar baz',
      languageCode: 'en',
      ...props,
    };
  }

  async function setupTest(flowOptions: Partial<IComprehendSentimentNodeConfig> = {}): Promise<void> {
    const flow = [
      { id: 'f1', type: 'tab', label: 'Test Flow' },
      createTestHostFlow(),
      createTestFlow(flowOptions),
      { id: 'successNode', z: 'f1', type: 'helper' },
      { id: 'errorNode', z: 'f1', type: 'helper' },
    ];

    await helper.load([AWSConfigNode, AWSComprehendSentimentNode], flow, createTestCredentials());
  }

  function createTestFlow(
    options: Partial<IComprehendSentimentNodeConfig>,
  ): TestFlowsItem<IComprehendSentimentNodeConfig> {
    return {
      id: 'n1',
      z: 'f1',
      type: 'aws-comprehend-sentiment',
      config: 'n0',
      languageCode: 'languageCode',
      output: 'output',
      logging: false,
      wires: [['successNode'], ['errorNode']],
      ...options,
    };
  }
});
