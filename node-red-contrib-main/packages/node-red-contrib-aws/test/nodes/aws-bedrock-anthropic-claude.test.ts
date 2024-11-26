import helper, { TestFlowsItem } from 'node-red-node-test-helper';

import AWSConfigNode from '../../src/nodes/aws-config';
import AnthropicClaudeNode, {
  IAnthropicClaudeNode,
  IAnthropicClaudeNodeConfig,
  IAnthropicClaudeNodeMessage,
  IAnthropicClaudeNodeMessagePayload,
} from '../../src/nodes/aws-bedrock-anthropic-claude';

import * as AnthropicClaudeClientModule from '../../src/lib/anthropicClaude';

import { createAWSConfigTestSetup, createTestOutputHelper } from '../helper';
import { IAnthropicClaudeInvokeModelResult } from '../../src/lib/anthropicClaude';

const mockedCreateInvokeModelPayload = jest.fn() as jest.MockedFunction<
  typeof AnthropicClaudeClientModule.AnthropicClaudeClient.prototype.createInvokeModelPayload
>;
const mockedInvokeModel = jest.fn() as jest.MockedFunction<
  typeof AnthropicClaudeClientModule.AnthropicClaudeClient.prototype.invokeModel
>;

jest.mock<typeof import('../../src/lib/anthropicClaude')>('../../src/lib/anthropicClaude', () => {
  const originalModule = jest.requireActual<typeof import('../../src/lib/anthropicClaude')>(
    '../../src/lib/anthropicClaude',
  );

  return {
    ...originalModule,
    AnthropicClaudeClient: jest.fn().mockImplementation(() => {
      return {
        createInvokeModelPayload: mockedCreateInvokeModelPayload,
        invokeModel: mockedInvokeModel,
      };
    }),
  };
});

helper.init(require.resolve('node-red'));

describe('aws-comprehend-entities', () => {
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
      name: 'myName',
      region: 'myRegion',
      model: 'myModel',
      anthropicVersion: 'myAnthropicVersion',
      maxTokens: 1024,
      output: 'myOutputProp',
      contentOnly: true,
    });

    const n1 = helper.getNode('n1') as IAnthropicClaudeNode;

    expect(n1).toHaveProperty('name');
    expect(n1).toHaveProperty('region');
    expect(n1).toHaveProperty('model');
    expect(n1).toHaveProperty('anthropicVersion');
    expect(n1).toHaveProperty('maxTokens');
    expect(n1).toHaveProperty('output');
    expect(n1).toHaveProperty('contentOnly');

    expect(n1.name).toBe('myName');
    expect(n1.region).toBe('myRegion');
    expect(n1.model).toBe('myModel');
    expect(n1.anthropicVersion).toBe('myAnthropicVersion');
    expect(n1.maxTokens).toBe(1024);
    expect(n1.output).toBe('myOutputProp');
    expect(n1.contentOnly).toBe(true);
  });

  it('should forward result to success output', async () => {
    const mockedResult: IAnthropicClaudeInvokeModelResult = {
      id: 'some-id',
      type: 'some-type',
      role: 'some-role',
      model: 'some-model',
      usage: {
        input_tokens: 10,
        output_tokens: 20,
      },
      content: [],
    };
    mockedCreateInvokeModelPayload.mockReturnValue({
      anthropic_version: 'myAnthropicVersion',
      max_tokens: 1024,
      messages: [],
    });
    mockedInvokeModel.mockResolvedValue(mockedResult);

    await setupTest();

    const n1 = helper.getNode('n1') as IAnthropicClaudeNode;

    n1.receive(createInputMessage());

    await testSuccessOutput(async (_msg: unknown) => {
      const msg = _msg as IAnthropicClaudeNodeMessage;
      expect(msg).toHaveProperty('output');
      expect(msg.output).toEqual(mockedResult);
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
  ])('should throw an error if no text ($text) is provided in payload', async ({ text }) => {
    await setupTest();

    const n1 = helper.getNode('n1') as IAnthropicClaudeNode;

    // @ts-expect-error wrong type (testing purpose)
    n1.receive(createInputMessage({ text }));

    await testErrorOutput(async (_msg: unknown) => {
      const msg = _msg as IAnthropicClaudeNodeMessage;
      expect(msg).toHaveProperty('error');
      expect(msg.error).toEqual(
        expect.objectContaining({ message: expect.stringContaining('No text as payload found.') }),
      );
    });
  });

  it('should show an error if config is not found', async () => {
    const flow = [createTestFlow({})];
    await helper.load([AWSConfigNode, AnthropicClaudeNode], flow, createTestCredentials());
    const n1 = helper.getNode('n1') as IAnthropicClaudeNode;

    await new Promise(resolve => {
      // @ts-expect-error signature not declared
      n1.on('call:error', call => {
        call.should.be.calledWithExactly('No aws config found!');
        resolve({});
      });
    });
  });

  function createInputMessage(payload: Partial<IAnthropicClaudeNodeMessagePayload> = {}): IAnthropicClaudeNodeMessage {
    return {
      _msgid: 'test-message-id',
      payload: {
        text: 'test text',
        ...payload,
      },
    };
  }

  async function setupTest(flowOptions: Partial<IAnthropicClaudeNodeConfig> = {}): Promise<void> {
    const flow = [
      { id: 'f1', type: 'tab', label: 'Test Flow' },
      createTestHostFlow(),
      createTestFlow(flowOptions),
      { id: 'successNode', z: 'f1', type: 'helper' },
      { id: 'errorNode', z: 'f1', type: 'helper' },
    ];

    await helper.load([AWSConfigNode, AnthropicClaudeNode], flow, createTestCredentials());
  }

  function createTestFlow(options: Partial<IAnthropicClaudeNodeConfig>): TestFlowsItem<IAnthropicClaudeNodeConfig> {
    return {
      id: 'n1',
      z: 'f1',
      type: 'aws-bedrock-anthropic-claude',
      config: 'n0',
      name: 'Anthropic Claude',
      region: 'myRegion',
      model: 'myModel',
      anthropicVersion: 'myAnthropicVersion',
      maxTokens: 1024,
      output: 'output',
      contentOnly: false,
      wires: [['successNode'], ['errorNode']],
      ...options,
    };
  }
});
