import axios, { AxiosRequestConfig } from 'axios';

import {
  MimirItemAttachmentRequest,
  IMimirItemAttachmentCreatePayload,
  IMimirItemAttachmentUpdatePayload,
  IMimirItemAttachmentDeletePayload,
} from '../../src/lib/MimirItemAttachmentRequest';

import { createRequestInstance, createRequestHeaders, TEST_BASE_URL, TEST_ITEM_ID } from '../helper';

type ITestPayload = IMimirItemAttachmentCreatePayload | IMimirItemAttachmentUpdatePayload;

interface ITestCallData {
  headers: {
    [key: string]: unknown;
  };
  method: string;
  url: string;
  data: unknown;
}

jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;
const mockedAxiosPut = axios.put as jest.MockedFunction<typeof axios.put>;

describe('MimirItemAttachmentRequest', () => {
  it('should make correct axios request for "fetchList"', async () => {
    const mockedItems = [{ fileName: 'file1.png' }];
    mockedAxios.mockResolvedValue({ status: 200, data: mockedItems });

    const apiRequest = createRequestInstance(MimirItemAttachmentRequest);

    expect(mockedAxios).not.toHaveBeenCalled();
    const result = await apiRequest.fetchList(TEST_ITEM_ID);
    expect(result).toEqual(mockedItems);
    expect(mockedAxios).toHaveBeenCalledWith({
      headers: createRequestHeaders(),
      method: 'GET',
      url: createUrl(TEST_ITEM_ID),
    });
  });

  it('should make correct axios request for "fetch"', async () => {
    const fileName = 'file1.png';
    const mockedDownloadUrl = 'https://download.now';
    mockedAxios.mockResolvedValue({ status: 200, data: mockedDownloadUrl });

    const apiRequest = createRequestInstance(MimirItemAttachmentRequest);

    expect(mockedAxios).not.toHaveBeenCalled();
    const result = await apiRequest.fetch(TEST_ITEM_ID, fileName);
    expect(result).toEqual(mockedDownloadUrl);
    expect(mockedAxios).toHaveBeenCalledWith({
      headers: createRequestHeaders(),
      method: 'GET',
      url: createUrl(TEST_ITEM_ID) + `?attachment=${fileName}`,
    });
  });

  it('should make correct axios request for "update"', async () => {
    const mockedItem = createFilePayload();
    mockedAxios.mockResolvedValue({ status: 200, data: mockedItem });

    const apiRequest = createRequestInstance(MimirItemAttachmentRequest);
    const payload = createFilePayload();

    expect(mockedAxios).not.toHaveBeenCalled();
    const result = await apiRequest.update(TEST_ITEM_ID, payload);
    expect(result).toEqual(mockedItem);
    expect(mockedAxios).toHaveBeenCalledWith({
      headers: createRequestHeaders(),
      method: 'PUT',
      url: createUrl(TEST_ITEM_ID),
      data: payload,
    });
  });

  it('should make correct axios request for "delete"', async () => {
    mockedAxios.mockResolvedValue({ status: 200 });

    const apiRequest = createRequestInstance(MimirItemAttachmentRequest);
    const payload = {
      fileName: 'file1.png',
      type: 'file',
    } as IMimirItemAttachmentDeletePayload;

    expect(mockedAxios).not.toHaveBeenCalled();
    const result = await apiRequest.delete(TEST_ITEM_ID, payload);
    expect(result).toEqual(undefined);
    expect(mockedAxios).toHaveBeenCalledWith({
      headers: createRequestHeaders(),
      method: 'DELETE',
      url: createUrl(TEST_ITEM_ID),
      data: payload,
    });
  });

  describe('should make correct axios requests for "create"', () => {
    const TEST_SIGNED_URL = '__SIGNED_URL__';

    it('should create a new attachment if there is no attachment with same name', async () => {
      setupCreateMocks(TEST_SIGNED_URL, []);

      const apiRequest = createRequestInstance(MimirItemAttachmentRequest);
      const payload = createFilePayload();
      const uploadContent = { test: true };

      expect(mockedAxios).not.toHaveBeenCalled();
      const result = await apiRequest.create(TEST_ITEM_ID, payload, uploadContent);
      expect(result).toEqual(undefined);
      expect(mockedAxios.mock.calls.length).toBe(2);
      expect(mockedAxiosPut.mock.calls.length).toBe(1);
      expect(mockedAxios.mock.calls[0]).toEqual(createPrecheckCallData(TEST_ITEM_ID, payload));
      expect(mockedAxios.mock.calls[1]).toEqual(createFetchSignedUrltCallData(TEST_ITEM_ID, payload));
      expect(mockedAxiosPut.mock.calls[0]).toEqual(createUploadContentCallData(TEST_SIGNED_URL, uploadContent));
    });

    it('should create a new attachment if there is no attachment with same name and it is a poster thumbnail', async () => {
      setupCreateMocks(TEST_SIGNED_URL, []);

      const apiRequest = createRequestInstance(MimirItemAttachmentRequest);
      const payload = createPosterFramePayload();
      const uploadContent = { test: true };

      expect(mockedAxios).not.toHaveBeenCalled();
      const result = await apiRequest.create(TEST_ITEM_ID, payload, uploadContent);
      expect(result).toEqual(undefined);
      expect(mockedAxios.mock.calls.length).toBe(3);
      expect(mockedAxiosPut.mock.calls.length).toBe(1);
      expect(mockedAxios.mock.calls[0]).toEqual(createPrecheckCallData(TEST_ITEM_ID, payload));
      expect(mockedAxios.mock.calls[1]).toEqual(createFetchSignedUrltCallData(TEST_ITEM_ID, payload));
      expect(mockedAxiosPut.mock.calls[0]).toEqual(createUploadContentCallData(TEST_SIGNED_URL, uploadContent));
      expect(mockedAxios.mock.calls[2]).toEqual(createUploadConfirmationCallData(TEST_ITEM_ID, payload));
    });

    it('should create a new attachment if there is already an attachment with same name and force overwrite is active', async () => {
      setupCreateMocks(TEST_SIGNED_URL, ['file1.png']);

      const apiRequest = createRequestInstance(MimirItemAttachmentRequest);
      const payload = createFilePayload();
      const uploadContent = { test: true };

      expect(mockedAxios).not.toHaveBeenCalled();
      const result = await apiRequest.create(TEST_ITEM_ID, payload, uploadContent, true);
      expect(result).toEqual(undefined);
      expect(mockedAxios.mock.calls.length).toBe(3);
      expect(mockedAxiosPut.mock.calls.length).toBe(1);
      expect(mockedAxios.mock.calls[0]).toEqual(createPrecheckCallData(TEST_ITEM_ID, payload));
      expect(mockedAxios.mock.calls[1]).toEqual(createDeleteCallData(TEST_ITEM_ID, payload));
      expect(mockedAxios.mock.calls[2]).toEqual(createFetchSignedUrltCallData(TEST_ITEM_ID, payload));
      expect(mockedAxiosPut.mock.calls[0]).toEqual(createUploadContentCallData(TEST_SIGNED_URL, uploadContent));
    });

    it('should create a new attachment if there is already an attachment with same name, force overwrite is active and it is a poster thumbnail', async () => {
      setupCreateMocks(TEST_SIGNED_URL, ['poster-frame.png']);

      const apiRequest = createRequestInstance(MimirItemAttachmentRequest);
      const payload = createPosterFramePayload();
      const uploadContent = { test: true };

      expect(mockedAxios).not.toHaveBeenCalled();
      const result = await apiRequest.create(TEST_ITEM_ID, payload, uploadContent, true);
      expect(result).toEqual(undefined);
      expect(mockedAxios.mock.calls.length).toBe(4);
      expect(mockedAxiosPut.mock.calls.length).toBe(1);
      expect(mockedAxios.mock.calls[0]).toEqual(createPrecheckCallData(TEST_ITEM_ID, payload));
      expect(mockedAxios.mock.calls[1]).toEqual(createDeleteCallData(TEST_ITEM_ID, payload));
      expect(mockedAxios.mock.calls[2]).toEqual(createFetchSignedUrltCallData(TEST_ITEM_ID, payload));
      expect(mockedAxiosPut.mock.calls[0]).toEqual(createUploadContentCallData(TEST_SIGNED_URL, uploadContent));
      expect(mockedAxios.mock.calls[3]).toEqual(createUploadConfirmationCallData(TEST_ITEM_ID, payload));
    });

    it('should throw an error if there is already an attachment with same name and force overwrite is not active', async () => {
      setupCreateMocks(TEST_SIGNED_URL, ['file1.png']);

      const apiRequest = createRequestInstance(MimirItemAttachmentRequest);
      const payload = createFilePayload();
      const uploadContent = { test: true };

      expect(async () => await apiRequest.create(TEST_ITEM_ID, payload, uploadContent)).rejects.toThrow(
        'Attachment "file1.png" already exists on mimir item',
      );
    });
  });

  function setupCreateMocks(signedUrl: string, existingFileNames: string[]): void {
    mockedAxios.mockImplementation((config: unknown) => {
      const { method, url } = config as AxiosRequestConfig;

      if (method === 'POST') {
        if (url?.includes('isPrecheck=true')) {
          return Promise.resolve({ status: 200, data: { existingFileNames } });
        }
        return Promise.resolve({ status: 200, data: signedUrl });
      }

      return Promise.resolve({ status: 200 });
    });
    mockedAxiosPut.mockResolvedValue({ status: 200 });
  }

  function createPrecheckCallData(itemId: string, payload: IMimirItemAttachmentCreatePayload): ITestCallData[] {
    const { fileName, type } = payload;
    return [
      {
        headers: createRequestHeaders(),
        method: 'POST',
        url: createUrl(itemId) + '?isPrecheck=true',
        data: {
          fileName,
          type,
        },
      },
    ];
  }

  function createDeleteCallData(itemId: string, payload: IMimirItemAttachmentCreatePayload): ITestCallData[] {
    return [
      {
        headers: createRequestHeaders(),
        method: 'DELETE',
        url: createUrl(itemId),
        data: payload,
      },
    ];
  }

  function createFetchSignedUrltCallData(itemId: string, payload: IMimirItemAttachmentCreatePayload): ITestCallData[] {
    return [
      {
        headers: createRequestHeaders(),
        method: 'POST',
        url: createUrl(itemId),
        data: payload,
      },
    ];
  }

  function createUploadContentCallData(signedUrl: string, uploadContent: unknown): unknown[] {
    return [
      signedUrl,
      uploadContent,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    ];
  }

  function createUploadConfirmationCallData(
    itemId: string,
    payload: IMimirItemAttachmentCreatePayload,
  ): ITestCallData[] {
    return [
      {
        headers: createRequestHeaders(),
        method: 'PUT',
        url: createUrl(itemId),
        data: payload,
      },
    ];
  }

  function createFilePayload(): ITestPayload {
    return {
      fileName: 'file1.png',
      type: 'file',
      role: 'file',
    };
  }

  function createPosterFramePayload(): ITestPayload {
    return {
      fileName: 'poster-frame.png',
      type: 'poster',
      role: 'thumbnail',
    };
  }

  function createUrl(itemId: string): string {
    return `${TEST_BASE_URL}/api/v1/items/${itemId}/attachments`;
  }
});
