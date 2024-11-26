import axios from 'axios';

import { MimirApiRequest } from './MimirApiRequest';

const API_PATH = '/api/v1/items/{itemId}/attachments';

export type TItemAttachmentType = 'poster' | 'prproj' | 'image' | 'subtitle' | 'file';
export type TItemAttachmentRole = 'thumbnail' | 'poster' | 'subtitle' | 'file';

export type IMimirItemAttachmentCreatePayload = IItemAttachment;

export type IMimirItemAttachmentUpdatePayload = IItemAttachment;

export interface IMimirItemAttachmentDeletePayload {
  fileName: string;
  type: TItemAttachmentType;
}

export interface IItemAttachment {
  fileName: string;
  type: TItemAttachmentType;
  role: TItemAttachmentRole;
  language?: string;
  description?: string;
}

export interface IMimirItemAttachmentPrecheckResponse {
  existingFileNames: string[];
}

export class MimirItemAttachmentRequest extends MimirApiRequest {
  async fetchList(itemId: string): Promise<IItemAttachment[]> {
    return this.request('GET', this.getApiPath(itemId));
  }

  async fetch(itemId: string, attachment: string): Promise<IItemAttachment> {
    return this.request('GET', `${this.getApiPath(itemId)}?attachment=${attachment}`);
  }

  async create(
    itemId: string,
    payload: IMimirItemAttachmentCreatePayload,
    uploadContent: unknown,
    forceOverwrite: boolean = false,
  ): Promise<void> {
    return (
      Promise.resolve()
        .then(() => this.prepareUploadAttachment(itemId, payload, forceOverwrite))
        .then(() => this.fetchSignedUploadAttachmentUrl(itemId, payload))
        .then(signedUrl => this.uploadAttachment(signedUrl, uploadContent))
        // NOTE: thumbnail poster frame has to be confirmed additionally
        .then(() => this.confirmForThumbnailPosterFrame(itemId, payload))
    );
  }

  async update(itemId: string, payload: IMimirItemAttachmentUpdatePayload): Promise<IItemAttachment> {
    return this.request('PUT', this.getApiPath(itemId), payload);
  }

  async delete(itemId: string, payload: IMimirItemAttachmentDeletePayload): Promise<string> {
    return this.request('DELETE', this.getApiPath(itemId), payload);
  }

  async prepareUploadAttachment(
    itemId: string,
    payload: IMimirItemAttachmentCreatePayload,
    forceOverwrite: boolean,
  ): Promise<void> {
    const attachmentExists = await this.doesAttachmentExist(itemId, payload);

    if (!attachmentExists) {
      return;
    }

    if (forceOverwrite) {
      await this.delete(itemId, payload);
    } else {
      throw new Error(`Attachment "${payload.fileName}" already exists on mimir item (${itemId})!`);
    }
  }

  async doesAttachmentExist(itemId: string, payload: IMimirItemAttachmentCreatePayload): Promise<boolean> {
    const { fileName, type } = payload;
    return this.request<IMimirItemAttachmentPrecheckResponse>('POST', `${this.getApiPath(itemId)}?isPrecheck=true`, {
      fileName,
      type,
    }).then(data => !!data.existingFileNames?.includes(fileName));
  }

  async fetchSignedUploadAttachmentUrl(itemId: string, payload: IMimirItemAttachmentCreatePayload): Promise<string> {
    return this.request('POST', this.getApiPath(itemId), payload);
  }

  async uploadAttachment(signedUrl: string, uploadContent: unknown): Promise<string> {
    const headers = {
      'Content-Type': 'multipart/form-data',
    };

    this.onRequestStart('PUT', signedUrl);
    return axios.put(signedUrl, uploadContent, { headers }).then(response => response.data);
  }

  async confirmForThumbnailPosterFrame(itemId: string, payload: IMimirItemAttachmentCreatePayload): Promise<void> {
    const { role, type } = payload;

    if (role === 'thumbnail' && type === 'poster') {
      await this.request('PUT', this.getApiPath(itemId), payload);
    }
  }

  getApiPath(itemId: string): string {
    return API_PATH.replace('{itemId}', itemId);
  }
}
