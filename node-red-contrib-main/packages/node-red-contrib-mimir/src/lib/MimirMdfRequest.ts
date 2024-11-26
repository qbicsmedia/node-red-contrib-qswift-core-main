import { MimirApiRequest } from './MimirApiRequest';

const API_PATH = '/api/v1/mdfs';

export interface IMimirMdfCreatePayload {
  label: string;
  active: boolean;
}

export interface IMimirMdfUpdatePayload {
  fields: IMdfItemField[];
}

interface IMimirMdfRetrieveAllResponse {
  _embedded: {
    collection: IMdfItem[];
  };
}

export interface IMdfItem {
  id: string;
  label: string;
  active: boolean;
  fields: IMdfItemField[];
}

export interface IMdfItemField {
  id: string;
  fieldId: string;
  type: 'text' | 'checkbox' | 'date' | 'number' | 'choice' | 'multiplechoice' | 'link' | 'user';
  required: boolean;
}

export class MimirMdfRequest extends MimirApiRequest {
  retrieveAll(): Promise<IMdfItem[]> {
    return this.request<IMimirMdfRetrieveAllResponse>('GET', API_PATH).then((data: IMimirMdfRetrieveAllResponse) => {
      // just return collection for retrieveAll instead of nested structure
      const collection = data && data._embedded ? data._embedded.collection : null;
      return collection instanceof Array ? collection : [];
    });
  }

  retrieve(mdfId: string): Promise<IMdfItem> {
    return this.request('GET', `${API_PATH}/${mdfId}`);
  }

  create(payload: IMimirMdfCreatePayload): Promise<IMdfItem> {
    return this.request('POST', API_PATH, payload);
  }

  update(mdfId: string, payload: IMimirMdfUpdatePayload): Promise<IMdfItem> {
    return this.request('PUT', `${API_PATH}/${mdfId}`, payload);
  }

  delete(mdfId: string): Promise<string> {
    return this.request('DELETE', `${API_PATH}/${mdfId}`);
  }
}
