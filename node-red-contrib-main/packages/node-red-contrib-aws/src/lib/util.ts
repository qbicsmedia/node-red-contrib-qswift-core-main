import { IAWSConfigNode } from '../nodes/aws-config';

export interface IAWSClientOptions {
  region: string;
  credentials: IAWSClientOptionsCredentials;
}

export interface IAWSClientOptionsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
}

export function createAWSClientOptions(awsConfig: IAWSConfigNode): IAWSClientOptions {
  const { credentials, region } = awsConfig;
  const { accessKeyId, secretAccessKey } = credentials;

  return {
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  };
}

export function getValueByPath(path: string, msg: Record<string, unknown>): unknown {
  return path.split('.').reduce<unknown>((obj, key) => {
    if (obj !== null && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, key)) {
      return (obj as Record<string, unknown>)[key];
    }
    return undefined;
  }, msg);
}

export function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function checkMaxBytesString(str: string, maxBytes: number): string {
  const buffer = Buffer.from(str);
  return buffer.byteLength > maxBytes ? buffer.subarray(0, maxBytes).toString() : str;
}

export async function flattenResultItemList<T, R>(resultList: T[][], map: (item: T) => R[] | undefined): Promise<R[]> {
  return resultList.reduce((memo: R[], list: T[]) => {
    const items = list.reduce((innerMemo: R[], item: T) => {
      return [...innerMemo, ...(map(item) ?? [])];
    }, []);
    return [...memo, ...items];
  }, []);
}
