import { Node, NodeAPI, NodeDef, NodeMessageInFlow } from 'node-red';
import { BatchDetectKeyPhrasesItemResult, KeyPhrase, LanguageCode } from '@aws-sdk/client-comprehend';

import { TextBatch } from '../lib/textBatch';
import { AWSComprehendClient, BATCH_SIZE, MAX_BYTES_KEY_PHRASES } from '../lib/comprehendClient';
import { evaluateLanguageCode } from '../lib/languageCode';
import { checkMaxBytesString, createAWSClientOptions, flattenResultItemList } from '../lib/util';

import { IAWSConfigNode } from './aws-config';

export interface IComprehendBatchKeyPhrasesNode extends Node {
  languageCode: string;
  output: string;
  logging: boolean;
}

export interface IComprehendBatchKeyPhrasesNodeConfig extends NodeDef {
  config: string;
  languageCode: string;
  output: string;
  logging: boolean;
}

export interface IComprehendBatchKeyPhrasesNodeMessage extends NodeMessageInFlow {
  payload: string[];
  [key: string]: unknown;
}

export default function (RED: NodeAPI): void {
  function AWSComprehendBatchKeyPhrasesNode(
    this: IComprehendBatchKeyPhrasesNode,
    config: IComprehendBatchKeyPhrasesNodeConfig,
  ): void {
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
    const loggerType = 'key-phrases';
    const textBatch = new TextBatch({
      nodeId: node.id,
      type: loggerType,
      batchSize: BATCH_SIZE,
      loggingEnabled: node.logging,
      redLogger: RED.log,
    });

    node.on('input', handleMessage);

    async function handleMessage(_msg: unknown): Promise<void> {
      const msg = _msg as IComprehendBatchKeyPhrasesNodeMessage;

      try {
        const languageCode = evaluateLanguageCode(node, msg);
        const makeBatchDetectKeyPhrasesRequest = configureBatchDetectKeyPhrasesRequest(comprehendClient, languageCode);
        const result = await textBatch.handleBatch(msg.payload, (batchChunks: string[][]): Promise<KeyPhrase[]> => {
          return Promise.all(batchChunks.map(makeBatchDetectKeyPhrasesRequest)).then(resultList =>
            flattenResultItemList<BatchDetectKeyPhrasesItemResult, KeyPhrase>(
              resultList,
              itemResult => itemResult.KeyPhrases,
            ),
          );
        });

        msg[node.output] = result;

        node.send([msg, null]);
      } catch (err) {
        msg.error = err;
        node.send([null, msg]);

        RED.log.error(`[node:${node.id}] [batch:${loggerType}] ${err}`);
      }
    }
  }

  function configureBatchDetectKeyPhrasesRequest(client: AWSComprehendClient, languageCode: LanguageCode) {
    return async (batchChunk: string[]) => {
      const input = {
        TextList: batchChunk.map(chunk => checkMaxBytesString(chunk, MAX_BYTES_KEY_PHRASES)),
        LanguageCode: languageCode,
      };
      const { ResultList } = await client.batchDetectKeyPhrases(input);

      return ResultList ?? [];
    };
  }

  RED.nodes.registerType('aws-comprehend-batch-key-phrases', AWSComprehendBatchKeyPhrasesNode);
}
