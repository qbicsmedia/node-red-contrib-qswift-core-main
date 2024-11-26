import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

import { IAWSClientOptions, isNonEmptyString } from './util';

export type TAnthropicClaudeMessageRole = 'assistant' | 'user';
export type TAnthropicClaudeInvokeModelResult = IAnthropicClaudeInvokeModelResult | string;

export interface IAnthropicClaudeInvokeModelPayloadOptions {
  anthropicVersion: string;
  assistant?: string;
  maxTokens: number;
  system?: string;
  text: string;
  temperature?: number;
}

export interface IAnthropicClaudeInvokeModelPayload {
  anthropic_version: string;
  max_tokens: number;
  messages: Array<IAnthropicClaudeInvokeModelPayloadMessage>;
  system?: string;
  temperature?: number;
}

export interface IAnthropicClaudeInvokeModelPayloadMessage {
  role: TAnthropicClaudeMessageRole;
  content: string;
}

export interface IAnthropicClaudeInvokeModelResult {
  id: string;
  type: string;
  role: string;
  model: string;
  usage: IAnthropicClaudeInvokeModelResultUsage;
  content: IAnthropicClaudeInvokeModelResultContentItem[];
}

export interface IAnthropicClaudeInvokeModelResultUsage {
  input_tokens: number;
  output_tokens: number;
}

export interface IAnthropicClaudeInvokeModelResultContentItem {
  type: string;
  text: string;
}

export class AnthropicClaudeClient {
  client: BedrockRuntimeClient;

  constructor(clientConfig: IAWSClientOptions, region: string) {
    const options = {
      ...clientConfig,
      // client has to be initialized with the region of used model
      region,
    };
    this.client = new BedrockRuntimeClient(options);
  }

  async invokeModel(
    modelArn: string,
    payload: IAnthropicClaudeInvokeModelPayload,
    contentOnly: boolean = false,
  ): Promise<TAnthropicClaudeInvokeModelResult> {
    const input = {
      contentType: 'application/json',
      body: JSON.stringify(payload),
      modelId: modelArn,
    };

    const command = new InvokeModelCommand(input);
    const response = await this.client.send(command);
    const result = Buffer.from(response.body.buffer).toString();
    const parsedResult = JSON.parse(result);

    if (contentOnly) {
      if (!Array.isArray(parsedResult?.content) || parsedResult.content.length === 0) {
        throw new Error('Invalid result structure for "content only" output mode.');
      }

      const { text } = parsedResult.content[0];
      return typeof text === 'string' ? text.trim() : text;
    }

    return parsedResult;
  }

  createInvokeModelPayload(options: IAnthropicClaudeInvokeModelPayloadOptions): IAnthropicClaudeInvokeModelPayload {
    const { anthropicVersion, assistant, maxTokens, system, text, temperature } = options;
    const messages: IAnthropicClaudeInvokeModelPayloadMessage[] = [{ role: 'user', content: text }];

    if (isNonEmptyString(assistant)) {
      messages.push({ role: 'assistant', content: assistant as string });
    }

    const payload: IAnthropicClaudeInvokeModelPayload = {
      anthropic_version: anthropicVersion,
      max_tokens: maxTokens,
      messages,
    };

    if (isNonEmptyString(system)) {
      payload.system = system;
    }

    if (typeof temperature === 'number') {
      payload.temperature = temperature;
    }

    return payload;
  }
}
