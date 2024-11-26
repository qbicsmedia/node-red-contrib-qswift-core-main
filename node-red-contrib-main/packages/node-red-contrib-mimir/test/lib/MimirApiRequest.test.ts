import axios from 'axios';

import { MimirApiRequest } from '../../src/lib/MimirApiRequest';
import { MimirApiRequestConfig } from '../../src/lib/MimirApiRequestConfig';

jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('MimirApiRequest', () => {
  const apiRequestConfig = new MimirApiRequestConfig({
    baseUrl: 'https://tenant.local',
    tokenList: [
      { name: 'tenant1', apiKey: 'apiKey1' },
      { name: 'tenant2', apiKey: 'apiKey2' },
      { name: 'tenant3', apiKey: 'apiKey3' },
    ],
    customBaseUrls: [
      { tenantName: 'tenant1', baseUrl: 'https://tenant1.local' },
      { tenantName: 'tenant2', baseUrl: 'https://tenant2.local' },
    ],
  });

  it.each(['GET'])('should make correct axios request without payload (method: %s)', async method => {
    mockedAxios.mockResolvedValue(createMockedResponse({ hello: 'world' }));

    const apiRequest = new MimirApiRequest(apiRequestConfig, { tenant: 'tenant1' });

    expect(mockedAxios).not.toHaveBeenCalled();
    const result = await apiRequest.request('GET', '/path/to/somewhere');
    expect(result).toEqual({ hello: 'world' });
    expect(mockedAxios).toHaveBeenCalledWith({
      headers: {
        'x-mimir-cognito-id-token': 'Bearer apiKey1',
      },
      method,
      url: 'https://tenant1.local/path/to/somewhere',
    });
  });

  it.each(['PUT', 'POST', 'DELETE'])('should make correct axios request with payload (method: %s)', async method => {
    mockedAxios.mockResolvedValue(createMockedResponse({ hello: 'world' }));

    const apiRequest = new MimirApiRequest(apiRequestConfig, { tenant: 'tenant2' });

    expect(mockedAxios).not.toHaveBeenCalled();
    const result = await apiRequest.request(method, '/path/to/somewhere/else', { payload: 'some data' });
    expect(result).toEqual({ hello: 'world' });
    expect(mockedAxios).toHaveBeenCalledWith({
      headers: {
        'x-mimir-cognito-id-token': 'Bearer apiKey2',
      },
      method,
      url: 'https://tenant2.local/path/to/somewhere/else',
      data: {
        payload: 'some data',
      },
    });
  });

  it('should provide a hook for request start', async () => {
    mockedAxios.mockResolvedValue(createMockedResponse());

    const hookSpy = jest.fn();
    const apiRequest = new MimirApiRequest(apiRequestConfig, {
      tenant: 'tenant3',
      onRequestStart: hookSpy,
    });

    expect(hookSpy).not.toHaveBeenCalled();
    await apiRequest.request('POST', '/path/to/elsewhere', { payload: 'some data' });
    expect(hookSpy).toHaveBeenCalledWith('POST', '/path/to/elsewhere');
  });

  it('should fallback to method get when not a string', async () => {
    mockedAxios.mockResolvedValue(createMockedResponse());

    const apiRequest = new MimirApiRequest(apiRequestConfig, { tenant: 'tenant3' });

    expect(mockedAxios).not.toHaveBeenCalled();
    // @ts-expect-error wrong type (testing purpose)
    await apiRequest.request(null, '/path/to/fallback', { payload: 'some data' });
    expect(mockedAxios).toHaveBeenCalledWith({
      headers: {
        'x-mimir-cognito-id-token': 'Bearer apiKey3',
      },
      method: 'GET',
      url: 'https://tenant.local/path/to/fallback',
    });
  });

  it('should add provided custom headers to request', async () => {
    mockedAxios.mockResolvedValue(createMockedResponse());

    const apiRequest = new MimirApiRequest(apiRequestConfig, {
      tenant: 'tenant3',
      headers: {
        'x-custom-header-one': 'custom header 1',
        'x-custom-header-two': 'custom header 2',
      },
    });

    expect(mockedAxios).not.toHaveBeenCalled();
    await apiRequest.request('GET', '/path/to/headers');
    expect(mockedAxios).toHaveBeenCalledWith({
      headers: {
        'x-mimir-cognito-id-token': 'Bearer apiKey3',
        'x-custom-header-one': 'custom header 1',
        'x-custom-header-two': 'custom header 2',
      },
      method: 'GET',
      url: 'https://tenant.local/path/to/headers',
    });
  });

  function createMockedResponse(data: unknown = {}, status: number = 200): { status: number; data: unknown } {
    return { status, data };
  }
});
