import { BatchDetectSentimentItemResult, SentimentScore } from '@aws-sdk/client-comprehend';

export interface IOverallSentimentScore {
  cumulatedSentimentScore: SentimentScore;
  averageSentimentScore: SentimentScore;
}

export async function flattenBatchSentimentResultList(
  resultList: BatchDetectSentimentItemResult[][],
): Promise<BatchDetectSentimentItemResult[]> {
  return resultList.reduce((memo: BatchDetectSentimentItemResult[], list: BatchDetectSentimentItemResult[]) => {
    return [
      ...memo,
      ...list.map(item => {
        return {
          Sentiment: item.Sentiment,
          SentimentScore: item.SentimentScore,
        };
      }),
    ];
  }, []);
}

export function calculateOverallSentimentScore(resultList: BatchDetectSentimentItemResult[]): IOverallSentimentScore {
  const scoreCount = resultList.length;
  const zeroedSentimentScore = {
    Mixed: 0,
    Negative: 0,
    Neutral: 0,
    Positive: 0,
  };
  const sentimentScoreKeys = Object.keys(zeroedSentimentScore);

  if (scoreCount === 0) {
    return {
      cumulatedSentimentScore: zeroedSentimentScore,
      averageSentimentScore: zeroedSentimentScore,
    };
  }

  const cumulatedSentimentScore = resultList.reduce(
    (memo, result) => {
      const sentimentScore = result.SentimentScore ?? {};

      Object.keys(sentimentScore).forEach((_sentiment: unknown) => {
        const sentiment = _sentiment as keyof SentimentScore;

        if (sentimentScoreKeys.includes(sentiment)) {
          memo[sentiment] += sentimentScore[sentiment] ?? 0;
        }
      });

      return memo;
    },
    {
      ...zeroedSentimentScore,
    },
  );

  const averageSentimentScore = Object.keys(cumulatedSentimentScore).reduce(
    (memo, _sentiment: unknown) => {
      const sentiment = _sentiment as keyof SentimentScore;
      memo[sentiment] = cumulatedSentimentScore[sentiment] / scoreCount;
      return memo;
    },
    {
      ...zeroedSentimentScore,
    },
  );

  return {
    cumulatedSentimentScore,
    averageSentimentScore,
  };
}
