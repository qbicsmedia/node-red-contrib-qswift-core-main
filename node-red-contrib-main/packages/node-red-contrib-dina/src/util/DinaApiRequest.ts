import { IDinaConfigNode } from '@dina/nodes/dina-config';
import { ApiRequest } from '@dina/util/ApiRequest';

export class DinaApiRequest extends ApiRequest {
  private apiKey: string;

  constructor(dinaConfig: IDinaConfigNode) {
    super(dinaConfig);
    this.apiKey = dinaConfig.credentials.apiKey;
  }

  createHeaders(): { [key: string]: string } {
    return {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  fetchStory(id: string | number): Promise<unknown> {
    const options = this.createOptions('GET', `stories/${id}`);
    return this.fetch(options);
  }

  fetchInstance(id: string | number): Promise<unknown> {
    const options = this.createOptions('GET', `instances/${id}`);
    return this.fetch(options);
  }
}
