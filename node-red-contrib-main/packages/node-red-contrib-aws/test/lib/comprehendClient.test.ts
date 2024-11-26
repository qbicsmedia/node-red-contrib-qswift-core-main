import {
  BatchDetectEntitiesCommand,
  BatchDetectKeyPhrasesCommand,
  BatchDetectSentimentCommand,
  ComprehendClient,
  DetectEntitiesCommand,
  DetectKeyPhrasesCommand,
  DetectSentimentCommand,
  Entity,
  KeyPhrase,
  LanguageCode,
  SentimentType,
} from '@aws-sdk/client-comprehend';
import { AwsClientStub, mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';

import { AWSComprehendClient, getAvailableLanguageCode } from '../../src/lib/comprehendClient';

describe('comprehendClient', () => {
  describe('AWSComprehenClient', () => {
    let client: AWSComprehendClient;
    let comprehendMock: AwsClientStub<ComprehendClient>;

    const testInputSingle = {
      Text: 'this is a text for testing',
      LanguageCode: 'en' as LanguageCode,
    };
    const testInputBatch = {
      TextList: ['this is a text for testing'],
      LanguageCode: 'en' as LanguageCode,
    };

    beforeEach(() => {
      comprehendMock = mockClient(ComprehendClient);
      client = new AWSComprehendClient({
        region: 'myRegion',
        credentials: {
          accessKeyId: 'myAccessKeyId',
          secretAccessKey: 'mySecretAccessKey',
        },
      });
    });

    it('should be able to call detectEntities', async () => {
      const mockedResult = {
        Entities: [],
      };
      comprehendMock.on(DetectEntitiesCommand).resolves(mockedResult);

      expect(comprehendMock).not.toHaveReceivedAnyCommand();
      const result = await client.detectEntities(testInputSingle);

      expect(comprehendMock).toHaveReceivedCommand(DetectEntitiesCommand);
      expect(comprehendMock).toHaveReceivedCommandWith(DetectEntitiesCommand, testInputSingle);
      expect(result).toEqual(mockedResult);
    });

    it('should be able to call detectKeyPhrases', async () => {
      const mockedResult = {
        KeyPhrases: [],
      };
      comprehendMock.on(DetectKeyPhrasesCommand).resolves(mockedResult);

      expect(comprehendMock).not.toHaveReceivedAnyCommand();
      const result = await client.detectKeyPhrases(testInputSingle);

      expect(comprehendMock).toHaveReceivedCommand(DetectKeyPhrasesCommand);
      expect(comprehendMock).toHaveReceivedCommandWith(DetectKeyPhrasesCommand, testInputSingle);
      expect(result).toEqual(mockedResult);
    });

    it('should be able to call detectSentiment', async () => {
      const mockedResult = {
        Sentiment: 'NEUTRAL' as SentimentType,
        SentimentScore: {
          Positive: 0.1,
          Negative: 0.1,
          Neutral: 0.7,
          Mixed: 0.1,
        },
      };
      comprehendMock.on(DetectSentimentCommand).resolves(mockedResult);

      expect(comprehendMock).not.toHaveReceivedAnyCommand();
      const result = await client.detectSentiment(testInputSingle);

      expect(comprehendMock).toHaveReceivedCommand(DetectSentimentCommand);
      expect(comprehendMock).toHaveReceivedCommandWith(DetectSentimentCommand, testInputSingle);
      expect(result).toEqual(mockedResult);
    });

    it('should be able to call batchDetectEntities', async () => {
      const mockedResult = {
        ResultList: [
          {
            Index: 0,
            Entities: [] as Entity[],
          },
        ],
      };
      comprehendMock.on(BatchDetectEntitiesCommand).resolves(mockedResult);

      expect(comprehendMock).not.toHaveReceivedAnyCommand();
      const result = await client.batchDetectEntities(testInputBatch);

      expect(comprehendMock).toHaveReceivedCommand(BatchDetectEntitiesCommand);
      expect(comprehendMock).toHaveReceivedCommandWith(BatchDetectEntitiesCommand, testInputBatch);
      expect(result).toEqual(mockedResult);
    });

    it('should be able to call batchDetectKeyPhrases', async () => {
      const mockedResult = {
        ResultList: [
          {
            Index: 0,
            KeyPhrases: [] as KeyPhrase[],
          },
        ],
      };
      comprehendMock.on(BatchDetectKeyPhrasesCommand).resolves(mockedResult);

      expect(comprehendMock).not.toHaveReceivedAnyCommand();
      const result = await client.batchDetectKeyPhrases(testInputBatch);

      expect(comprehendMock).toHaveReceivedCommand(BatchDetectKeyPhrasesCommand);
      expect(comprehendMock).toHaveReceivedCommandWith(BatchDetectKeyPhrasesCommand, testInputBatch);
      expect(result).toEqual(mockedResult);
    });

    it('should be able to call batchDetectSentiment', async () => {
      const mockedResult = {
        ResultList: [
          {
            Index: 0,
            Sentiment: 'NEUTRAL' as SentimentType,
            SentimentScore: {
              Positive: 0.1,
              Negative: 0.1,
              Neutral: 0.7,
              Mixed: 0.1,
            },
          },
        ],
      };
      comprehendMock.on(BatchDetectSentimentCommand).resolves(mockedResult);

      expect(comprehendMock).not.toHaveReceivedAnyCommand();
      const result = await client.batchDetectSentiment(testInputBatch);

      expect(comprehendMock).toHaveReceivedCommand(BatchDetectSentimentCommand);
      expect(comprehendMock).toHaveReceivedCommandWith(BatchDetectSentimentCommand, testInputBatch);
      expect(result).toEqual(mockedResult);
    });
  });

  describe('getAvailableLanguageCode', () => {
    it.each([
      { languageCode: 'en', expected: 'en' },
      { languageCode: 'en-GB', expected: 'en' },
      { languageCode: 'en-US', expected: 'en' },
      { languageCode: 'de', expected: 'de' },
      { languageCode: 'de-AT', expected: 'de' },
      { languageCode: 'zh-TW', expected: 'zh-TW' },
    ])('should return supported language code ($languageCode)', ({ languageCode, expected }) => {
      expect(getAvailableLanguageCode(languageCode)).toBe(expected);
    });

    it.each([
      { languageCode: 123 },
      { languageCode: true },
      { languageCode: null },
      { languageCode: undefined },
      { languageCode: {} },
      { languageCode: [] },
      { languageCode: (): void => {} },
    ])('should return null if given language code is not a string ($languageCode)', ({ languageCode }) => {
      expect(getAvailableLanguageCode(languageCode)).toBe(null);
    });

    it('should return null if no supported language code was found', () => {
      expect(getAvailableLanguageCode('invalid')).toBe(null);
    });
  });
});
