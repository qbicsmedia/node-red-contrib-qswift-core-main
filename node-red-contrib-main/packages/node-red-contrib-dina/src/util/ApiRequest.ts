import { axios, AxiosRequestConfig, AxiosResponse } from '@dina/lib/axios';

export interface ApiConfig {
  baseUrl?: string;
}

export class ApiRequest {
  baseUrl?: string;

  constructor(config: ApiConfig) {
    this.baseUrl = config?.baseUrl;
  }

  async fetch(options: AxiosRequestConfig): Promise<unknown> {
    return axios(options).then((response: AxiosResponse) => response.data);
  }

  createOptions(method: string, path: string, payload?: unknown): AxiosRequestConfig {
    const validatedMethod = validateMethod(method);
    const options: AxiosRequestConfig = {
      method: validatedMethod,
      url: `${this.baseUrl}/${path}`,
      headers: this.createHeaders(),
    };

    if (shouldAddPayload(validatedMethod)) {
      options.data = payload;
    }

    return options;
  }

  createHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }
}

const validateMethod = (method: string): string => {
  const uppercaseMethod = typeof method === 'string' ? method.toUpperCase() : '';
  return ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS', 'PATCH'].includes(uppercaseMethod)
    ? uppercaseMethod
    : method;
};

const shouldAddPayload = (method: string): boolean => {
  return ['PUT', 'POST'].includes(method);
};
