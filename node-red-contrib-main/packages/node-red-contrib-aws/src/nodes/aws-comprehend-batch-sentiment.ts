import { Node, NodeAPI, NodeDef, NodeMessageInFlow } from 'node-red';
import { BatchDetectSentimentItemResult, LanguageCode } from '@aws-sdk/client-comprehend';

import { TextBatch } from '../lib/textBatch';
import { AWSComprehendClient, BATCH_SIZE, MAX_BYTES_SENTIMENT } from '../lib/comprehendClient';
import { evaluateLanguageCode } from '../lib/languageCode';
import { checkMaxBytesString, createAWSClientOptions } from '../lib/util';
import { calculateOverallSentimentScore, flattenBatchSentimentResultList } from '../lib/batchSentimentHelper';

import { IAWSConfigNode } from './aws-config';

export interface IComprehendBatchSentimentNode extends Node {
  languageCode: string;
  output: string;
  logging: boolean;
}

export interface IComprehendBatchSentimentNodeConfig extends NodeDef {
  config: string;
  languageCode: string;
  output: string;
  logging: boolean;
}

export interface IComprehendBatchSentimentNodeMessage extends NodeMessageInFlow {
  payload: string[];
  [key: string]: unknown;
}

export default function (RED: NodeAPI): void {
  function AWSComprehendBatchSentimentNode(
    this: IComprehendBatchSentimentNode,
    config: IComprehendBatchSentimentNodeConfig,
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
    const loggerType = 'sentiment';
    const textBatch = new TextBatch({
      nodeId: node.id,
      type: loggerType,
      batchSize: BATCH_SIZE,
      loggingEnabled: node.logging,
      redLogger: RED.log,
    });

    node.on('input', handleMessage);

    async function handleMessage(_msg: unknown): Promise<void> {
      const msg = _msg as IComprehendBatchSentimentNodeMessage;

      try {
        const languageCode = evaluateLanguageCode(node, msg);
        const makeBatchDetectSentimentRequest = configureBatchDetectSentimentRequest(comprehendClient, languageCode);
        const resultList = await textBatch.handleBatch(
          msg.payload,
          (batchChunks: string[][]): Promise<BatchDetectSentimentItemResult[]> => {
            return Promise.all(batchChunks.map(makeBatchDetectSentimentRequest)).then(flattenBatchSentimentResultList);
          },
        );
        const overallSentimentScore = calculateOverallSentimentScore(resultList as BatchDetectSentimentItemResult[]);

        msg[node.output] = {
          resultList,
          ...overallSentimentScore,
        };

        node.send([msg, null]);
      } catch (err) {
        msg.error = err;
        node.send([null, msg]);

        RED.log.error(`[node:${node.id}] [batch:${loggerType}] ${err}`);
      }
    }
  }

  function configureBatchDetectSentimentRequest(client: AWSComprehendClient, languageCode: LanguageCode) {
    return async (batchChunk: string[]) => {
      const input = {
        TextList: batchChunk.map(chunk => checkMaxBytesString(chunk, MAX_BYTES_SENTIMENT)),
        LanguageCode: languageCode,
      };
      const { ResultList } = await client.batchDetectSentiment(input);

      return ResultList ?? [];
    };
  }

  RED.nodes.registerType('aws-comprehend-batch-sentiment', AWSComprehendBatchSentimentNode);
}
