import { MimirApiRequest } from './MimirApiRequest';

const API_PATH = '/api/v1/storages/{storageId}/transferRequests';

type TMimirTransferRequestArtefact = 'proxy' | 'highres' | 'aaf';

export interface IMimirTransferRequestCreatePayload {
  itemId: string;
  artefact?: TMimirTransferRequestArtefact;
  targetFileName?: string;
  createLinkForTargetFileName?: boolean;
}

export interface IMimirTransferRequestLockPayload {
  storageManagerInstanceId: string;
  transferState: string;
}

export interface IMimirTransferRequestDeletePayload {
  transferState: string;
}

export interface IMimirTransferRequestLockResponse {
  cutoffTime: number;
}

export interface IMimirTransferRequestGetAllResponse {
  _embedded: {
    collection: ITransferRequestItem[];
  };
}

export interface ITransferRequestItem {
  id: string;
  itemId: string;
  storageId: string;
  originalFileName: string;
  transferState: string;
  artifact: TMimirTransferRequestArtefact;
  highresIsOffline: boolean;
  statusMessage: string;
  isProxy: boolean;
}

export class MimirTransferRequest extends MimirApiRequest {
  getAll(storageId: string): Promise<ITransferRequestItem[]> {
    return this.request<IMimirTransferRequestGetAllResponse>('GET', this.getApiPath(storageId)).then(data => {
      // just return collection for getAll instead of nested structure
      const collection = data && data._embedded ? data._embedded.collection : null;
      return collection instanceof Array ? collection : [];
    });
  }

  get(storageId: string, transferRequestId: string): Promise<ITransferRequestItem> {
    return this.request('GET', `${this.getApiPath(storageId)}/${transferRequestId}`);
  }

  create(storageId: string, payload: IMimirTransferRequestCreatePayload): Promise<ITransferRequestItem> {
    return this.request('POST', this.getApiPath(storageId), payload);
  }

  lock(
    storageId: string,
    transferRequestId: string,
    payload: IMimirTransferRequestLockPayload,
  ): Promise<IMimirTransferRequestLockResponse> {
    return this.request('POST', `${this.getApiPath(storageId)}/${transferRequestId}`, payload);
  }

  delete(storageId: string, transferRequestId: string, payload?: IMimirTransferRequestDeletePayload): Promise<string> {
    return this.request('DELETE', `${this.getApiPath(storageId)}/${transferRequestId}`, payload);
  }

  getApiPath(storageId: string): string {
    return API_PATH.replace('{storageId}', storageId);
  }
}
