import axios from 'axios';

import { MimirTransferRequest } from '../../src/lib/MimirTransferRequest';

import { createRequestInstance, createRequestHeaders, TEST_BASE_URL, TEST_ITEM_ID } from '../helper';

jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('MimirTransferRequest', () => {
  const TEST_STORAGE_ID = 'm1m1r-k3ld4-570r463-1d';
  const TEST_TRANSFER_REQUEST_ID = '7r4n5f3r-r3qu357-1d';

  it('should make correct axios request for "getAll"', async () => {
    const mockedItems = [
      { id: 1, title: 'Item 1' },
      { id: 2, title: 'Item 2' },
      { id: 3, title: 'Item 3' },
    ];
    mockedAxios.mockResolvedValue({
      status: 200,
      data: {
        _embedded: {
          collection: mockedItems,
        },
      },
    });

    const apiRequest = createRequestInstance(MimirTransferRequest);

    expect(mockedAxios).not.toHaveBeenCalled();
    const result = await apiRequest.getAll(TEST_STORAGE_ID);
    expect(result).toEqual(mockedItems);
    expect(mockedAxios).toHaveBeenCalledWith({
      headers: createRequestHeaders(),
      method: 'GET',
      url: createUrl(),
    });
  });

  it('should make correct axios request for "getAll" and return empty array on invalid response', async () => {
    mockedAxios.mockResolvedValue({ status: 200 });

    const apiRequest = createRequestInstance(MimirTransferRequest);

    expect(mockedAxios).not.toHaveBeenCalled();
    const result = await apiRequest.getAll(TEST_STORAGE_ID);
    expect(result).toEqual([]);
    expect(mockedAxios).toHaveBeenCalledWith({
      headers: createRequestHeaders(),
      method: 'GET',
      url: createUrl(),
    });
  });

  it('should make correct axios request for "get"', async () => {
    const mockedItem = {
      id: 1,
      title: 'Item 1',
    };
    mockedAxios.mockResolvedValue({ status: 200, data: mockedItem });

    const apiRequest = createRequestInstance(MimirTransferRequest);

    expect(mockedAxios).not.toHaveBeenCalled();
    const result = await apiRequest.get(TEST_STORAGE_ID, TEST_TRANSFER_REQUEST_ID);
    expect(result).toEqual(mockedItem);
    expect(mockedAxios).toHaveBeenCalledWith({
      headers: createRequestHeaders(),
      method: 'GET',
      url: createUrl(TEST_TRANSFER_REQUEST_ID),
    });
  });

  it('should make correct axios request for "create"', async () => {
    mockedAxios.mockResolvedValue({ status: 200, data: '__SIGNED_URL__' });

    const apiRequest = createRequestInstance(MimirTransferRequest);
    const payload = { itemId: TEST_ITEM_ID };

    expect(mockedAxios).not.toHaveBeenCalled();
    const result = await apiRequest.create(TEST_STORAGE_ID, payload);
    expect(result).toEqual('__SIGNED_URL__');
    expect(mockedAxios).toHaveBeenCalledWith({
      headers: createRequestHeaders(),
      method: 'POST',
      url: createUrl(),
      data: payload,
    });
  });

  it('should make correct axios request for "lock"', async () => {
    const mockedResponse = { cutoffTime: 123 };
    mockedAxios.mockResolvedValue({ status: 200, data: mockedResponse });

    const apiRequest = createRequestInstance(MimirTransferRequest);
    const payload = {
      storageManagerInstanceId: TEST_STORAGE_ID,
      transferState: 'pending',
    };

    expect(mockedAxios).not.toHaveBeenCalled();
    const result = await apiRequest.lock(TEST_STORAGE_ID, TEST_TRANSFER_REQUEST_ID, payload);
    expect(result).toEqual(mockedResponse);
    expect(mockedAxios).toHaveBeenCalledWith({
      headers: createRequestHeaders(),
      method: 'POST',
      url: createUrl(TEST_TRANSFER_REQUEST_ID),
      data: payload,
    });
  });

  it('should make correct axios request for "delete"', async () => {
    mockedAxios.mockResolvedValue({ status: 200 });

    const apiRequest = createRequestInstance(MimirTransferRequest);
    const payload = {
      transferState: 'pending',
    };

    expect(mockedAxios).not.toHaveBeenCalled();
    const result = await apiRequest.delete(TEST_STORAGE_ID, TEST_TRANSFER_REQUEST_ID, payload);
    expect(result).toEqual(undefined);
    expect(mockedAxios).toHaveBeenCalledWith({
      headers: createRequestHeaders(),
      method: 'DELETE',
      url: createUrl(TEST_TRANSFER_REQUEST_ID),
      data: payload,
    });
  });

  function createUrl(transferRequestId?: string): string {
    const suffix = typeof transferRequestId === 'string' ? `/${transferRequestId}` : '';
    return `${TEST_BASE_URL}/api/v1/storages/${TEST_STORAGE_ID}/transferRequests${suffix}`;
  }
});
