import RED from 'node-red';

export interface ITextBatchConfig {
  nodeId: string;
  type: string;
  batchSize: number;
  loggingEnabled: boolean;
  redLogger: typeof RED.log;
}

type TBatchProcessFn = (batchChunks: string[][]) => Promise<unknown[]>;

export class TextBatch {
  nodeId: string;
  type: string;
  batchSize: number;
  loggingEnabled: boolean;
  redLogger: typeof RED.log;

  constructor(config: ITextBatchConfig) {
    this.nodeId = config.nodeId;
    this.type = config.type;
    this.batchSize = config.batchSize;
    this.loggingEnabled = config.loggingEnabled;
    this.redLogger = config.redLogger;
  }

  async handleBatch(textList: string[], processBatchFn: TBatchProcessFn): Promise<ReturnType<TBatchProcessFn>> {
    if (!Array.isArray(textList)) {
      throw new Error(`No text list as payload found.`);
    }

    const batchChunkCount = Math.ceil(textList.length / this.batchSize);
    const batchChunks = Array.from({ length: batchChunkCount }).reduce((memo: string[][], _, idx: number) => {
      memo.push(textList.slice(idx * this.batchSize, (idx + 1) * this.batchSize));
      return memo;
    }, []);

    if (this.loggingEnabled) {
      this.redLogger.info(
        `[node:${this.nodeId}] [batch:${this.type}] Processing ${textList.length} document(s) in ${batchChunks.length} batch(es) with max ${this.batchSize} document(s).`,
      );
    }

    const resultList = await processBatchFn(batchChunks);

    if (this.loggingEnabled) {
      this.redLogger.info(
        `[node:${this.nodeId}] [batch:${this.type}] ${textList.length} document(s) in ${batchChunks.length} batch(es) processed successfully (${resultList.length} item(s)).`,
      );
    }

    return resultList;
  }
}
