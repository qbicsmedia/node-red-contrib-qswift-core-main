import axios from 'axios';

import { IDinaGraphQLConfigNode } from '@dina/nodes/dina-graphql-config';
import { DinaGraphQLRequest } from '@dina/util/DinaGraphQLRequest';

jest.mock('@aws-sdk/credential-providers', () => ({
  fromTemporaryCredentials: jest.fn(),
}));

jest.mock('@smithy/signature-v4', () => ({
  SignatureV4: jest.fn().mockImplementation(() => ({
    sign: jest.fn().mockResolvedValue({
      body: 'signedBody',
      headers: { 'Content-Type': 'application/json', host: 'example.com', Authorization: 'signed' },
      method: 'POST',
    }),
  })),
}));

jest.mock('axios');

describe('DinaGraphQLRequest', () => {
  let graphQLConfig: IDinaGraphQLConfigNode;
  let dinaGraphQLRequest: DinaGraphQLRequest;

  beforeEach(() => {
    graphQLConfig = {
      endpoint: 'https://example.com/graphql',
      assumeRoleArn: 'arn:aws:iam::123456789012:role/testRole',
    } as IDinaGraphQLConfigNode;

    dinaGraphQLRequest = new DinaGraphQLRequest(graphQLConfig);
    jest.clearAllMocks();
  });

  describe('request', () => {
    it('should send a signed request and return the response data', async () => {
      const payload = { query: '{ test }' };
      const responseData = { data: 'response data' };

      (axios as jest.MockedFunction<typeof axios>).mockResolvedValue({
        data: responseData,
      });

      const data = await dinaGraphQLRequest.request(payload);

      expect(data).toEqual(responseData);
      expect(axios).toHaveBeenCalledWith({
        url: 'https://example.com/graphql',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          host: 'example.com',
          Authorization: 'signed',
        },
        data: 'signedBody',
      });
    });

    it('should throw an error if the request fails', async () => {
      const payload = { query: '{ test }' };

      (axios as jest.MockedFunction<typeof axios>).mockRejectedValue(new Error('Request failed'));

      await expect(dinaGraphQLRequest.request(payload)).rejects.toThrow('Request failed');
    });
  });
});
