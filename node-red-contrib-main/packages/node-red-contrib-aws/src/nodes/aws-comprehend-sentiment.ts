import { Node, NodeAPI, NodeDef, NodeMessageInFlow } from 'node-red';

import { AWSComprehendClient, MAX_BYTES_SENTIMENT } from '../lib/comprehendClient';
import { evaluateLanguageCode } from '../lib/languageCode';
import { checkMaxBytesString, createAWSClientOptions } from '../lib/util';

import { IAWSConfigNode } from './aws-config';

export interface IComprehendSentimentNode extends Node {
  languageCode: string;
  output: string;
  logging: boolean;
}

export interface IComprehendSentimentNodeConfig extends NodeDef {
  config: string;
  languageCode: string;
  output: string;
  logging: boolean;
}

export interface IComprehendSentimentNodeMessage extends NodeMessageInFlow {
  payload: string;
  [key: string]: unknown;
}

export default function (RED: NodeAPI): void {
  function AWSComprehendSentimentNode(this: IComprehendSentimentNode, config: IComprehendSentimentNodeConfig): void {
    RED.nodes.createNode(this, config);

    this.languageCode = config.languageCode;
    this.output = config.output;
    this.logging = config.logging;

    const node = this;
    const awsConfig = RED.nodes.getNode(config.config) as IAWSConfigNode;

    if (!awsConfig) {
      node.error('No aws config found!');
      return;
    }

    const awsClientOptions = createAWSClientOptions(awsConfig);
    const comprehendClient = new AWSComprehendClient(awsClientOptions);

    node.on('input', handleMessage);

    async function handleMessage(_msg: unknown): Promise<void> {
      const msg = _msg as IComprehendSentimentNodeMessage;

      try {
        const text = msg.payload;

        if (typeof text !== 'string' || text.trim().length === 0) {
          throw new Error('No text as payload found.');
        }

        const languageCode = evaluateLanguageCode(node, msg);
        const input = {
          Text: checkMaxBytesString(text, MAX_BYTES_SENTIMENT),
          LanguageCode: languageCode,
        };
        const { Sentiment, SentimentScore } = await comprehendClient.detectSentiment(input);

        msg[node.output] = { Sentiment, SentimentScore };

        node.send([msg, null]);
      } catch (err) {
        msg.error = err;
        node.send([null, msg]);

        RED.log.error(`[node:${node.id}] [sentiment] ${err}`);
      }
    }
  }

  RED.nodes.registerType('aws-comprehend-sentiment', AWSComprehendSentimentNode);
}
