import axios from 'axios';

import { MimirMdfRequest } from '../../src/lib/MimirMdfRequest';

import { createRequestInstance, createRequestHeaders, TEST_BASE_URL, TEST_ITEM_ID } from '../helper';

jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('MimirMdfRequest', () => {
  it('should make correct axios request for "retrieveAll"', async () => {
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

    const apiRequest = createRequestInstance(MimirMdfRequest);

    expect(mockedAxios).not.toHaveBeenCalled();
    const result = await apiRequest.retrieveAll();
    expect(result).toEqual(mockedItems);
    expect(mockedAxios).toHaveBeenCalledWith({
      headers: createRequestHeaders(),
      method: 'GET',
      url: createUrl(),
    });
  });

  it('should make correct axios request for "retrieveAll" and return empty array on invalid response', async () => {
    mockedAxios.mockResolvedValue({ status: 200 });

    const apiRequest = createRequestInstance(MimirMdfRequest);

    expect(mockedAxios).not.toHaveBeenCalled();
    const result = await apiRequest.retrieveAll();
    expect(result).toEqual([]);
    expect(mockedAxios).toHaveBeenCalledWith({
      headers: createRequestHeaders(),
      method: 'GET',
      url: createUrl(),
    });
  });

  it('should make correct axios request for "retrieve"', async () => {
    const mockedItem = {
      id: 1,
      title: 'Item 1',
    };
    mockedAxios.mockResolvedValue({ status: 200, data: mockedItem });

    const apiRequest = createRequestInstance(MimirMdfRequest);

    expect(mockedAxios).not.toHaveBeenCalled();
    const result = await apiRequest.retrieve(TEST_ITEM_ID);
    expect(result).toEqual(mockedItem);
    expect(mockedAxios).toHaveBeenCalledWith({
      headers: createRequestHeaders(),
      method: 'GET',
      url: createUrl(TEST_ITEM_ID),
    });
  });

  it('should make correct axios request for "create"', async () => {
    const mockedItem = { id: 1, label: 'Item 1', active: true, fields: [] };
    mockedAxios.mockResolvedValue({ status: 200, data: mockedItem });

    const apiRequest = createRequestInstance(MimirMdfRequest);
    const payload = { label: 'Item 1', active: true };

    expect(mockedAxios).not.toHaveBeenCalled();
    const result = await apiRequest.create(payload);
    expect(result).toEqual(mockedItem);
    expect(mockedAxios).toHaveBeenCalledWith({
      headers: createRequestHeaders(),
      method: 'POST',
      url: createUrl(),
      data: payload,
    });
  });

  it('should make correct axios request for "update"', async () => {
    const mockedItem = { fields: [] };
    mockedAxios.mockResolvedValue({ status: 200, data: mockedItem });

    const apiRequest = createRequestInstance(MimirMdfRequest);
    const payload = { fields: [] };

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

    const apiRequest = createRequestInstance(MimirMdfRequest);

    expect(mockedAxios).not.toHaveBeenCalled();
    const result = await apiRequest.delete(TEST_ITEM_ID);
    expect(result).toEqual(undefined);
    expect(mockedAxios).toHaveBeenCalledWith({
      headers: createRequestHeaders(),
      method: 'DELETE',
      url: createUrl(TEST_ITEM_ID),
    });
  });

  function createUrl(mdfId?: string): string {
    const suffix = typeof mdfId === 'string' ? `/${mdfId}` : '';
    return `${TEST_BASE_URL}/api/v1/mdfs${suffix}`;
  }
});
