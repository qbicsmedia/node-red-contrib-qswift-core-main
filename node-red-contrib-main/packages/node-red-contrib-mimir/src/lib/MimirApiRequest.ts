import axios, { AxiosRequestConfig, RawAxiosRequestHeaders, Method } from 'axios';

import { MimirApiRequestConfig } from './MimirApiRequestConfig';
import { createVerboseLogger } from './verboseLogger';

export interface IMimirApiRequestOptions {
  tenant: string;
  headers?: RawAxiosRequestHeaders;
  verboseLogging?: boolean;
  onRequestStart?: TOnRequestStart;
}

export type TOnRequestStart = (method: string, path: string) => void;

const NOOP = (): void => {
  /* no operation */
};

export class MimirApiRequest {
  config: MimirApiRequestConfig;
  headers: RawAxiosRequestHeaders;
  tenant: string;
  verboseLogging: boolean;
  onRequestStart: TOnRequestStart;

  constructor(config: MimirApiRequestConfig, options: IMimirApiRequestOptions) {
    this.config = config;
    this.tenant = options.tenant;
    this.headers = options.headers ?? {};
    this.verboseLogging = !!options.verboseLogging;
    this.onRequestStart = typeof options.onRequestStart === 'function' ? options.onRequestStart : NOOP;
  }

  async request<T>(method: string, path: string, payload?: unknown): Promise<T> {
    const mimirToken = this.config.getToken(this.tenant);
    const url = `${this.config.getBaseUrl(this.tenant)}${path}`;
    const uppercaseMethod = typeof method === 'string' ? method.toUpperCase() : method;

    const vLog = createVerboseLogger(this.verboseLogging);
    const vLogArgs = payload ? [uppercaseMethod, url, payload] : [uppercaseMethod, url];
    vLog.apply(vLog, ['[START]', ...vLogArgs]);

    const axiosOptions: AxiosRequestConfig = {
      method: (uppercaseMethod as Method) || 'GET',
      url,
      headers: {
        'x-mimir-cognito-id-token': mimirToken,
        ...this.headers,
      },
    };

    // NOTE: some mimir apis also have a payload on DELETE requests
    if (['PUT', 'POST', 'DELETE'].includes(uppercaseMethod)) {
      axiosOptions.data = payload;
    }

    this.onRequestStart(uppercaseMethod, path);

    const response = await axios(axiosOptions);
    const { data, status, statusText } = response;
    vLog('[SUCCESS]', uppercaseMethod, url, status, statusText);

    return data;
  }
}
