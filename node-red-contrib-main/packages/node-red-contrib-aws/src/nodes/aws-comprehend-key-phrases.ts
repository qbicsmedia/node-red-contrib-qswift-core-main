import { Node, NodeAPI, NodeDef, NodeMessageInFlow } from 'node-red';

import { AWSComprehendClient, MAX_BYTES_KEY_PHRASES } from '../lib/comprehendClient';
import { evaluateLanguageCode } from '../lib/languageCode';
import { checkMaxBytesString, createAWSClientOptions } from '../lib/util';

import { IAWSConfigNode } from './aws-config';

export interface IComprehendKeyPhrasesNode extends Node {
  languageCode: string;
  output: string;
  logging: boolean;
}

export interface IComprehendKeyPhrasesNodeConfig extends NodeDef {
  config: string;
  languageCode: string;
  output: string;
  logging: boolean;
}

export interface IComprehendKeyPhrasesNodeMessage extends NodeMessageInFlow {
  payload: string;
  [key: string]: unknown;
}

export default function (RED: NodeAPI): void {
  function AWSComprehendKeyPhrasesNode(this: IComprehendKeyPhrasesNode, config: IComprehendKeyPhrasesNodeConfig): void {
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
      const msg = _msg as IComprehendKeyPhrasesNodeMessage;

      try {
        const text = msg.payload;

        if (typeof text !== 'string' || text.trim().length === 0) {
          throw new Error('No text as payload found.');
        }

        const languageCode = evaluateLanguageCode(node, msg);
        const input = {
          Text: checkMaxBytesString(text, MAX_BYTES_KEY_PHRASES),
          LanguageCode: languageCode,
        };
        const { KeyPhrases } = await comprehendClient.detectKeyPhrases(input);

        msg[node.output] = KeyPhrases;

        node.send([msg, null]);
      } catch (err) {
        msg.error = err;
        node.send([null, msg]);

        RED.log.error(`[node:${node.id}] [key-phrases] ${err}`);
      }
    }
  }

  RED.nodes.registerType('aws-comprehend-key-phrases', AWSComprehendKeyPhrasesNode);
}
