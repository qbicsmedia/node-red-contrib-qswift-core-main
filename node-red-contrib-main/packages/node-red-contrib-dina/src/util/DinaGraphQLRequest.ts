import { Sha256 } from '@aws-crypto/sha256-js';
import { fromTemporaryCredentials } from '@aws-sdk/credential-providers';
import { axios, AxiosResponse } from '@dina/lib/axios';
import { IDinaGraphQLConfigNode } from '@dina/nodes/dina-graphql-config';
import { HttpRequest } from '@smithy/protocol-http';
import { SignatureV4 } from '@smithy/signature-v4';

export class DinaGraphQLRequest {
  private endpoint: string;
  private assumeRoleArn: string;
  constructor(graphQLConfig: IDinaGraphQLConfigNode) {
    const { endpoint, assumeRoleArn } = graphQLConfig;

    this.endpoint = endpoint;
    this.assumeRoleArn = assumeRoleArn;
  }

  async request(payload: unknown): Promise<AxiosResponse> {
    const request = createRequest(this.endpoint, payload);
    const { body, headers, method } = await signRequest(request, this.assumeRoleArn);
    const options = {
      url: this.endpoint,
      method,
      headers,
      data: body,
    };

    return axios(options).then(response => response.data);
  }
}

function createRequest(endpoint: string, payload: unknown): HttpRequest {
  const url = new URL(endpoint);
  const options = {
    hostname: url.hostname,
    path: url.pathname,
    body: JSON.stringify(payload),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      host: url.hostname,
    },
  };

  return new HttpRequest(options);
}

async function signRequest(request: HttpRequest, assumeRoleArn: string) {
  const signer = new SignatureV4({
    credentials: fromTemporaryCredentials({
      params: {
        RoleArn: assumeRoleArn,
        RoleSessionName: 'dina-graphql',
        DurationSeconds: 3600,
      },
    }),
    service: 'appsync',
    region: process.env.AWS_REGION || '',
    sha256: Sha256,
  });

  return signer.sign(request);
}
