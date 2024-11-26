import { SentimentType } from '@aws-sdk/client-comprehend';
import { calculateOverallSentimentScore } from '../../src/lib/batchSentimentHelper';

describe('batchSentimentHelper', () => {
  const zeroedSentimentScore = {
    Mixed: 0,
    Negative: 0,
    Positive: 0,
    Neutral: 0,
  };

  it('should calculate correct overall sentiment score', () => {
    const resultList = [
      {
        Sentiment: 'NEUTRAL' as SentimentType,
        SentimentScore: { Mixed: 0.1, Negative: 0.2, Positive: 0.3, Neutral: 0.4 },
      },
      {
        Sentiment: 'POSITIVE' as SentimentType,
        SentimentScore: { Mixed: 0.1, Negative: 0.2, Positive: 0.4, Neutral: 0.3 },
      },
      {
        Sentiment: 'MIXED' as SentimentType,
        SentimentScore: { Mixed: 0.4, Negative: 0.1, Positive: 0.2, Neutral: 0.3 },
      },
    ];
    const expectedResponse = {
      cumulatedSentimentScore: {
        Mixed: expect.closeTo(0.6),
        Negative: expect.closeTo(0.5),
        Positive: expect.closeTo(0.9),
        Neutral: expect.closeTo(1.0),
      },
      averageSentimentScore: {
        Mixed: expect.closeTo(0.2),
        Negative: expect.closeTo(0.166),
        Positive: expect.closeTo(0.3),
        Neutral: expect.closeTo(0.3333),
      },
    };

    expect(calculateOverallSentimentScore(resultList)).toEqual(expectedResponse);
  });

  it('should return zeroed sentiment scores on empty result list', () => {
    const expectedResponse = {
      cumulatedSentimentScore: zeroedSentimentScore,
      averageSentimentScore: zeroedSentimentScore,
    };

    expect(calculateOverallSentimentScore([])).toEqual(expectedResponse);
  });

  it('should calculate only valid sentiment scores', () => {
    const resultList = [
      {
        Sentiment: 'NEUTRAL' as SentimentType,
        SentimentScore: { Invalid: 0.1, Other: 0.2, Whatever: 0.3, Nope: 0.4, Neutral: 0.5 },
      },
      {
        Sentiment: 'NEUTRAL' as SentimentType,
        SentimentScore: { Mixed: undefined, Negative: undefined, Positive: undefined, Neutral: undefined },
      },
      {
        Sentiment: 'NEUTRAL' as SentimentType,
        SentimentScore: undefined,
      },
      {
        Sentiment: 'NEUTRAL' as SentimentType,
        SentimentScore: { Mixed: 0.1, Other: 0.2, Whatever: 0.3, Nope: 0.4, Neutral: 0.3 },
      },
      {
        Sentiment: 'POSITIVE' as SentimentType,
        SentimentScore: { Positive: 0.5 },
      },
    ];
    const expectedResponse = {
      cumulatedSentimentScore: {
        Mixed: 0.1,
        Negative: 0,
        Positive: 0.5,
        Neutral: 0.8,
      },
      averageSentimentScore: {
        Mixed: 0.02,
        Negative: 0,
        Positive: 0.1,
        Neutral: 0.16,
      },
    };

    expect(calculateOverallSentimentScore(resultList)).toEqual(expectedResponse);
  });
});
