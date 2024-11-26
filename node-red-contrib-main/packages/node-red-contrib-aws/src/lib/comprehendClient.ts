import {
  ComprehendClient,
  LanguageCode,
  DetectEntitiesCommand,
  DetectEntitiesCommandInput,
  DetectEntitiesCommandOutput,
  DetectKeyPhrasesCommand,
  DetectKeyPhrasesCommandInput,
  DetectKeyPhrasesCommandOutput,
  DetectSentimentCommand,
  DetectSentimentCommandInput,
  DetectSentimentCommandOutput,
  BatchDetectEntitiesCommand,
  BatchDetectEntitiesCommandInput,
  BatchDetectEntitiesCommandOutput,
  BatchDetectKeyPhrasesCommand,
  BatchDetectKeyPhrasesCommandInput,
  BatchDetectKeyPhrasesCommandOutput,
  BatchDetectSentimentCommand,
  BatchDetectSentimentCommandInput,
  BatchDetectSentimentCommandOutput,
} from '@aws-sdk/client-comprehend';

import { IAWSClientOptions } from './util';

export { LanguageCode };
export const validLanguageCodes = Object.values(LanguageCode);
export const BATCH_SIZE = 25;
// NOTE: text limitation for entities/key phrases is 100k (100000 bytes, not 102400 bytes)
export const MAX_BYTES_ENTITIES = 100000;
export const MAX_BYTES_KEY_PHRASES = 100000;
// NOTE: text limitation is 5k (5000 bytes, not 5120 bytes)
export const MAX_BYTES_SENTIMENT = 5000;

export class AWSComprehendClient {
  client: ComprehendClient;

  constructor(clientOptions: IAWSClientOptions) {
    this.client = new ComprehendClient(clientOptions);
  }

  async detectEntities(commandInput: DetectEntitiesCommandInput): Promise<DetectEntitiesCommandOutput> {
    const command = new DetectEntitiesCommand(commandInput);
    return await this.client.send(command);
  }

  async detectKeyPhrases(commandInput: DetectKeyPhrasesCommandInput): Promise<DetectKeyPhrasesCommandOutput> {
    const command = new DetectKeyPhrasesCommand(commandInput);
    return await this.client.send(command);
  }

  async detectSentiment(commandInput: DetectSentimentCommandInput): Promise<DetectSentimentCommandOutput> {
    const command = new DetectSentimentCommand(commandInput);
    return await this.client.send(command);
  }

  async batchDetectEntities(commandInput: BatchDetectEntitiesCommandInput): Promise<BatchDetectEntitiesCommandOutput> {
    const command = new BatchDetectEntitiesCommand(commandInput);
    return await this.client.send(command);
  }

  async batchDetectKeyPhrases(
    commandInput: BatchDetectKeyPhrasesCommandInput,
  ): Promise<BatchDetectKeyPhrasesCommandOutput> {
    const command = new BatchDetectKeyPhrasesCommand(commandInput);
    return await this.client.send(command);
  }

  async batchDetectSentiment(
    commandInput: BatchDetectSentimentCommandInput,
  ): Promise<BatchDetectSentimentCommandOutput> {
    const command = new BatchDetectSentimentCommand(commandInput);
    return await this.client.send(command);
  }
}

export function getAvailableLanguageCode(languageCode: string | unknown): LanguageCode | null {
  if (typeof languageCode !== 'string') {
    return null;
  }

  const key = languageCode.replace('-', '_').toUpperCase() as keyof typeof LanguageCode;
  const shortKey = key.split('_')[0] as keyof typeof LanguageCode;

  return LanguageCode[key] || LanguageCode[shortKey] || null;
}
