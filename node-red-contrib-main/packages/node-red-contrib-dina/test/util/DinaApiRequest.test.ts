import { IDinaConfigNode } from '@dina/nodes/dina-config';
import { DinaApiRequest } from '@dina/util/DinaApiRequest';
import axios, { AxiosResponse } from 'axios';

jest.mock('axios');

const TEST_API_KEY: string = 'test-api-key';
const ERROR_OCCURRED: string = 'Error Occurred';

describe('DinaApiRequest', () => {
  let dinaConfig: IDinaConfigNode;
  let dinaApiRequest: DinaApiRequest;

  beforeEach(() => {
    dinaConfig = {
      credentials: {
        apiKey: TEST_API_KEY,
      },
      baseUrl: 'http://example.com',
    } as IDinaConfigNode;

    dinaApiRequest = new DinaApiRequest(dinaConfig);
    jest.clearAllMocks(); // Clear any previous mock calls
  });

  describe('createHeaders()', () => {
    it('should return headers with x-api-key and Content-Type', () => {
      const headers = dinaApiRequest.createHeaders();
      expect(headers).toEqual({
        'x-api-key': TEST_API_KEY,
        'Content-Type': 'application/json',
      });
    });
  });

  describe('fetchStory()', () => {
    it('should fetch a story by id and return the response data', async () => {
      const responseData = { data: 'story data' };
      (axios as jest.MockedFunction<typeof axios>).mockResolvedValue({ data: responseData } as AxiosResponse);

      const data = await dinaApiRequest.fetchStory(123);

      expect(data).toEqual(responseData);
      expect(axios).toHaveBeenCalledWith({
        method: 'GET',
        url: 'http://example.com/stories/123',
        headers: {
          'x-api-key': TEST_API_KEY,
          'Content-Type': 'application/json',
        },
      });
    });

    it('should throw an error if the request fails', async () => {
      (axios as jest.MockedFunction<typeof axios>).mockRejectedValue(new Error(ERROR_OCCURRED));

      await expect(dinaApiRequest.fetchStory(123)).rejects.toThrow(ERROR_OCCURRED);
    });
  });

  describe('fetchInstance()', () => {
    it('should fetch an instance by id and return the response data', async () => {
      const responseData = { data: 'instance data' };
      (axios as jest.MockedFunction<typeof axios>).mockResolvedValue({ data: responseData } as AxiosResponse);

      const data = await dinaApiRequest.fetchInstance(123);

      expect(data).toEqual(responseData);
      expect(axios).toHaveBeenCalledWith({
        method: 'GET',
        url: 'http://example.com/instances/123',
        headers: {
          'x-api-key': TEST_API_KEY,
          'Content-Type': 'application/json',
        },
      });
    });

    it('should throw an error if the request fails', async () => {
      (axios as jest.MockedFunction<typeof axios>).mockRejectedValue(new Error(ERROR_OCCURRED));

      await expect(dinaApiRequest.fetchInstance(123)).rejects.toThrow(ERROR_OCCURRED);
    });
  });
});
