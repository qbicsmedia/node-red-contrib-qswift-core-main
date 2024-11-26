import { Node, NodeAPI, NodeDef, NodeMessageInFlow } from 'node-red';

import { AWSComprehendClient, MAX_BYTES_ENTITIES } from '../lib/comprehendClient';
import { evaluateLanguageCode } from '../lib/languageCode';
import { checkMaxBytesString, createAWSClientOptions } from '../lib/util';

import { IAWSConfigNode } from './aws-config';

export interface IComprehendEntitiesNode extends Node {
  languageCode: string;
  output: string;
  logging: boolean;
}

export interface IComprehendEntitiesNodeConfig extends NodeDef {
  config: string;
  languageCode: string;
  output: string;
  logging: boolean;
}

export interface IComprehendEntitiesNodeMessage extends NodeMessageInFlow {
  payload: string;
  [key: string]: unknown;
}

export default function (RED: NodeAPI): void {
  function AWSComprehendEntitiesNode(this: IComprehendEntitiesNode, config: IComprehendEntitiesNodeConfig): void {
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
      const msg = _msg as IComprehendEntitiesNodeMessage;

      try {
        const text = msg.payload;

        if (typeof text !== 'string' || text.trim().length === 0) {
          throw new Error('No text as payload found.');
        }

        const languageCode = evaluateLanguageCode(node, msg);
        const input = {
          Text: checkMaxBytesString(text, MAX_BYTES_ENTITIES),
          LanguageCode: languageCode,
        };
        const { Entities } = await comprehendClient.detectEntities(input);

        msg[node.output] = Entities;

        node.send([msg, null]);
      } catch (err) {
        msg.error = err;
        node.send([null, msg]);

        RED.log.error(`[node:${node.id}] [entities] ${err}`);
      }
    }
  }

  RED.nodes.registerType('aws-comprehend-entities', AWSComprehendEntitiesNode);
}
