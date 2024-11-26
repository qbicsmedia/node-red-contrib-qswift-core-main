import { Node, NodeAPI, NodeDef, NodeMessageInFlow } from 'node-red';

import { AnthropicClaudeClient } from '../lib/anthropicClaude';
import { createAWSClientOptions } from '../lib/util';

import { IAWSConfigNode } from './aws-config';

export interface IAnthropicClaudeNode extends Node {
  region: string;
  model: string;
  anthropicVersion: string;
  maxTokens: number;
  output: string;
  contentOnly: boolean;
}

export interface IAnthropicClaudeNodeConfig extends NodeDef {
  config: string;
  region: string;
  model: string;
  anthropicVersion: string;
  maxTokens: number;
  output: string;
  contentOnly: boolean;
}

export interface IAnthropicClaudeNodeMessage extends NodeMessageInFlow {
  payload: IAnthropicClaudeNodeMessagePayload;
  [key: string]: unknown;
}

export interface IAnthropicClaudeNodeMessagePayload {
  text: string;
  assistant?: string;
  maxTokens?: number;
  system?: string;
  temperature?: number;
}

export default function (RED: NodeAPI): void {
  function AnthropicClaudeNode(this: IAnthropicClaudeNode, config: IAnthropicClaudeNodeConfig): void {
    RED.nodes.createNode(this, config);

    this.name = config.name;
    this.region = config.region;
    this.model = config.model;
    this.anthropicVersion = config.anthropicVersion;
    this.maxTokens = config.maxTokens;
    this.output = config.output;
    this.contentOnly = config.contentOnly;

    const node = this;
    const awsConfig = RED.nodes.getNode(config.config) as IAWSConfigNode;

    if (!awsConfig) {
      node.error('No aws config found!');
      return;
    }

    const awsClientOptions = createAWSClientOptions(awsConfig);
    const anthropicClaudeClient = new AnthropicClaudeClient(awsClientOptions, node.region);

    node.on('input', handleMessage);

    async function handleMessage(_msg: unknown): Promise<void> {
      const msg = _msg as IAnthropicClaudeNodeMessage;

      try {
        const { text } = msg.payload;

        if (typeof text !== 'string' || text.trim().length === 0) {
          throw new Error('No text as payload found.');
        }

        const { assistant, maxTokens, system, temperature } = msg.payload;
        const invokeModelPayload = anthropicClaudeClient.createInvokeModelPayload({
          anthropicVersion: node.anthropicVersion,
          maxTokens: maxTokens ?? node.maxTokens,
          assistant,
          system,
          text,
          temperature,
        });

        msg[node.output] = await anthropicClaudeClient.invokeModel(node.model, invokeModelPayload, node.contentOnly);

        node.send([msg, null]);
      } catch (err) {
        msg.error = err;
        node.send([null, msg]);

        RED.log.error(`[node:${node.id}] ${err}`);
      }
    }
  }

  RED.nodes.registerType('aws-bedrock-anthropic-claude', AnthropicClaudeNode);
}
