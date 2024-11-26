import { ApiConfig, ApiRequest } from '@dina/util/ApiRequest';
import axios from 'axios';
jest.mock('axios');
describe('createOptions()', () => {
  it('should create options with method GET', () => {
    const method: string = 'GET';
    const path: string = '/test/path';

    const config: ApiConfig = {
      baseUrl: '/baseUrl/test',
    };

    const apiRequest = new ApiRequest(config);
    const result = apiRequest.createOptions(method, path);
    expect(result).toEqual({
      method: 'GET',
      url: '/baseUrl/test//test/path',
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('should create options with method POST', () => {
    const method: string = 'POST';
    const path: string = '/test/path';
    const payload = {
      name: 'node-red',
      data: 'hello',
    };

    const config: ApiConfig = {
      baseUrl: '/baseUrl/test',
    };

    const apiRequest = new ApiRequest(config);
    const result = apiRequest.createOptions(method, path, payload);
    expect(result).toEqual({
      method: 'POST',
      url: '/baseUrl/test//test/path',
      headers: { 'Content-Type': 'application/json' },
      data: { name: 'node-red', data: 'hello' },
    });
  });
});

describe('fetch', () => {
  it('should fetch data using axios and return response data', async () => {
    const responseData = { data: 'response data' };
    const apiRequest = new ApiRequest({
      baseUrl: 'https://baseUrl/path',
    });
    (axios as unknown as jest.Mock).mockResolvedValue({ data: responseData });
    const data = await apiRequest.fetch(apiRequest.createOptions('GET', 'path'));
    expect(data).toEqual(responseData);
  });

  it('should throw an error if the request fails', async () => {
    const apiRequest = new ApiRequest({
      baseUrl: 'https://baseUrl/path',
    });
    (axios as jest.MockedFunction<typeof axios>).mockRejectedValue(new Error('Error Occurred'));
    const options = apiRequest.createOptions('GET', 'path');
    expect(apiRequest.fetch(options)).rejects.toThrow('Error Occurred');
  });
});
