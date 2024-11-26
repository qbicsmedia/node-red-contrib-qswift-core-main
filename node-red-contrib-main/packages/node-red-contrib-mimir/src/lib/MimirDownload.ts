import axios from 'axios';

export type TTextUrlType = 'srtUrl' | 'vttUrl' | 'translationSrtUrl' | 'translationVttUrl';
export type TTimedUrlType = 'timedTranscriptUrl' | 'timedTranslatedTranscriptUrl';
export type TUrlType = TTextUrlType | TTimedUrlType;

export type TDownloadData = string | ITimedTranscription[];
export type TMimirDownloadResult = IMimirDownloadResultText | IMimirDownloadResultTimedTranscription;

export interface IMimirDownloadPayload {
  srtUrl?: string;
  vttUrl?: string;
  translationSrtUrl?: string;
  translationVttUrl?: string;
  timedTranscriptUrl?: string;
  timedTranslatedTranscriptUrl?: string;
  languageCode?: string;
  translationLanguage?: string;
}

export interface IMimirDownloadResultText {
  text: string;
  timedTranscriptions?: never;
  languageCode: string | undefined;
}

export interface IMimirDownloadResultTimedTranscription {
  text?: never;
  timedTranscriptions: ITimedTranscription[];
  languageCode: string | undefined;
}

export interface ITimedTranscription {
  content: string;
  startTime: number;
  endTime: number;
}

export class MimirDownload {
  transformUrlTypes: string[];
  translatedUrlTypes: string[];
  timedTranscriptions: string[];

  constructor() {
    this.transformUrlTypes = ['srtUrl', 'vttUrl', 'translationSrtUrl', 'translationVttUrl'];
    this.translatedUrlTypes = ['translationSrtUrl', 'translationVttUrl', 'timedTranslatedTranscriptUrl'];
    this.timedTranscriptions = ['timedTranscriptUrl', 'timedTranslatedTranscriptUrl'];
  }

  async download(url: string): Promise<TDownloadData> {
    return axios.get(url).then(response => response.data);
  }

  extractUrl(payload: IMimirDownloadPayload, urlType: TUrlType): string | null {
    const url = payload && typeof payload[urlType] === 'string' ? payload[urlType] : null;
    return typeof url === 'string' && url.trim().length > 0 ? url : null;
  }

  extractLanguageCode(payload: IMimirDownloadPayload, urlType: TUrlType): string | undefined {
    const { languageCode, translationLanguage } = payload;
    return this.translatedUrlTypes.includes(urlType) ? translationLanguage : languageCode;
  }

  transformData(
    downloadData: TDownloadData,
    urlType: TUrlType,
    transformEnabled: boolean,
    languageCode: string | undefined,
  ): TMimirDownloadResult {
    if (this.timedTranscriptions.includes(urlType)) {
      return {
        timedTranscriptions: downloadData as ITimedTranscription[],
        languageCode,
      };
    }

    const data = downloadData as string;
    const text =
      this.transformUrlTypes.includes(urlType) && transformEnabled ? this.transformTranscription(data) : data;

    return {
      text,
      languageCode,
    };
  }

  transformTranscription(content: string): string {
    const sections = content.split('\n\n');

    return sections
      .reduce((memo: string[], section: string) => {
        const parts = section.split('\n');
        const texts = parts.length > 2 ? parts.slice(2) : [];

        return [...memo, ...texts];
      }, [])
      .join(' ')
      .replaceAll('  ', ' ');
  }
}
