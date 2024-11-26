import { AwsClientStub, mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';

import {
  AnthropicClaudeClient,
  IAnthropicClaudeInvokeModelPayload,
  TAnthropicClaudeMessageRole,
} from '../../src/lib/anthropicClaude';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

interface ISetupInvokeModelTestResult {
  modelArn: string;
  invokeModelPayload: IAnthropicClaudeInvokeModelPayload;
  expectedInput: {
    contentType: string;
    body: string;
    modelId: string;
  };
  mockedResult: ISetupInvokeModelTestMockedResult;
}

interface ISetupInvokeModelTestMockedResult {
  content?: { type: string; text: unknown }[];
}

describe('anthropicClaude', () => {
  let client: AnthropicClaudeClient;
  let bedrockMock: AwsClientStub<BedrockRuntimeClient>;

  const TEST_PROMPT_TEXT = 'this is a testing prompt';

  beforeEach(() => {
    bedrockMock = mockClient(BedrockRuntimeClient);
    client = new AnthropicClaudeClient(
      {
        region: 'myRegion',
        credentials: {
          accessKeyId: 'myAccessKeyId',
          secretAccessKey: 'mySecretAccessKey',
        },
      },
      'myOtherRegion',
    );
  });

  it('should be able to invoke model (whole response)', async () => {
    const resultText = 'this is some response testing text';
    const mockedResult = {
      content: [
        {
          type: 'assistant',
          text: resultText,
        },
      ],
    };
    const { modelArn, invokeModelPayload, expectedInput } = setupInvokeModelTest(mockedResult);

    expect(bedrockMock).not.toHaveReceivedAnyCommand();
    const result = await client.invokeModel(modelArn, invokeModelPayload);
    expect(bedrockMock).toHaveReceivedCommand(InvokeModelCommand);
    expect(bedrockMock).toHaveReceivedCommandWith(InvokeModelCommand, expectedInput);
    expect(result).toEqual(mockedResult);
  });

  it.each([{ resultText: 'this is some response testing text' }, { resultText: 1234 }])(
    'should be able to invoke model (content only)',
    async ({ resultText }) => {
      const mockedResult = {
        content: [
          {
            type: 'assistant',
            text: resultText,
          },
        ],
      };
      const { modelArn, invokeModelPayload, expectedInput } = setupInvokeModelTest(mockedResult);

      expect(bedrockMock).not.toHaveReceivedAnyCommand();
      const result = await client.invokeModel(modelArn, invokeModelPayload, true);
      expect(bedrockMock).toHaveReceivedCommand(InvokeModelCommand);
      expect(bedrockMock).toHaveReceivedCommandWith(InvokeModelCommand, expectedInput);
      expect(result).toEqual(resultText);
    },
  );

  it('should throw an error on invalid result structure for content only mode', async () => {
    const mockedResult = {
      content: 'invalid',
    };
    // @ts-expect-error testing invalid input
    const { modelArn, invokeModelPayload, expectedInput } = setupInvokeModelTest(mockedResult);

    expect(bedrockMock).not.toHaveReceivedAnyCommand();
    expect(() => client.invokeModel(modelArn, invokeModelPayload, true)).rejects.toThrow('Invalid result structure');
    expect(bedrockMock).toHaveReceivedCommand(InvokeModelCommand);
    expect(bedrockMock).toHaveReceivedCommandWith(InvokeModelCommand, expectedInput);
  });

  it.each([
    {
      type: 'minimal',
      inputPayload: {
        anthropicVersion: 'myAnthropicVersion',
        maxTokens: 1024,
        text: `${TEST_PROMPT_TEXT} (user)`,
      },
      expectedPayload: {
        anthropic_version: 'myAnthropicVersion',
        max_tokens: 1024,
        messages: [{ role: 'user', content: `${TEST_PROMPT_TEXT} (user)` }],
      },
    },
    {
      type: 'all options',
      inputPayload: {
        anthropicVersion: 'myAnthropicVersion',
        maxTokens: 1024,
        text: `${TEST_PROMPT_TEXT} (user)`,
        assistant: `${TEST_PROMPT_TEXT} (assistant)`,
        system: `${TEST_PROMPT_TEXT} (system)`,
        temperature: 1.0,
      },
      expectedPayload: {
        anthropic_version: 'myAnthropicVersion',
        max_tokens: 1024,
        system: `${TEST_PROMPT_TEXT} (system)`,
        messages: [
          { role: 'user', content: `${TEST_PROMPT_TEXT} (user)` },
          { role: 'assistant', content: `${TEST_PROMPT_TEXT} (assistant)` },
        ],
        temperature: 1.0,
      },
    },
  ])('should be able to create invoke model paylod ($type)', ({ inputPayload, expectedPayload }) => {
    const payload = client.createInvokeModelPayload(inputPayload);
    expect(payload).toEqual(expectedPayload);
  });

  function setupInvokeModelTest(mockedResult: ISetupInvokeModelTestMockedResult): ISetupInvokeModelTestResult {
    const textEncoder = new TextEncoder();

    bedrockMock.on(InvokeModelCommand).resolves({
      // @ts-expect-error Uint8ArrayBlobAdapter does not work
      body: textEncoder.encode(JSON.stringify(mockedResult)),
    });

    const modelArn = 'myModelArn';
    const invokeModelPayload = {
      anthropic_version: 'myAnthropicVersion',
      max_tokens: 1024,
      messages: [{ role: 'user' as TAnthropicClaudeMessageRole, content: `${TEST_PROMPT_TEXT} (user)` }],
    };
    const expectedInput = {
      contentType: 'application/json',
      body: JSON.stringify(invokeModelPayload),
      modelId: modelArn,
    };

    return {
      modelArn,
      invokeModelPayload,
      expectedInput,
      mockedResult,
    };
  }
});
