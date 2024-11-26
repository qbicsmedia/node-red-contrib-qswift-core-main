import axios, { AxiosError } from 'axios';
import RED, { Node, NodeMessage } from 'node-red';

import { MimirApiRequestConfig } from './MimirApiRequestConfig';
import { IMimirHostNode } from '../nodes/mimir-host';

interface ITenantPathProperties {
  tenantPath: string;
  tenantPathType: string;
}

interface IAxiosErrorInfo {
  url: string | undefined;
  data: unknown;
  method: string;
  status: number | null;
}

export function createApiRequestConfigFromConfigNode(configNode: IMimirHostNode): MimirApiRequestConfig {
  const { baseUrl, customBaseUrls, credentials } = configNode;
  const config = {
    baseUrl,
    tokenList: credentials.tenants,
    customBaseUrls: customBaseUrls ?? [],
  };

  return new MimirApiRequestConfig(config);
}

export function evaluateTenant(node: Node & ITenantPathProperties, msg: Record<string, unknown>): Promise<string> {
  const { tenantPath, tenantPathType } = node;

  return new Promise((resolve, reject) => {
    if (typeof tenantPath !== 'string') {
      throw new Error('Invalid tenant path!');
    }

    // NOTE:
    // evaluateNodeProperty will handle type "msg" differently and will throw a js error on non existent nested paths,
    // e.g. if msg does not have a "req" property for req.query.tenant
    if (tenantPathType === 'msg') {
      const tenantName = evaluateMessageTenantPath(tenantPath, msg);

      if (typeof tenantName !== 'string') {
        node.error(`No tenant name found at ${tenantPathType}.${tenantPath}!`);
      }

      return resolve(tenantName as string);
    } else {
      RED.util.evaluateNodeProperty(tenantPath, tenantPathType, node, msg, (err, tenantName) => {
        if (err) {
          reject(err);
        } else {
          resolve(tenantName);
        }
      });
    }
  });
}

export function handleSuccess<T>(
  node: Node,
  msg: NodeMessage & Record<string, unknown>,
  outputProperty: string = 'payload',
) {
  return (data: T): T => {
    msg[outputProperty] = data;
    delete msg.error;

    node.status({ fill: 'green', shape: 'dot', text: 'success' });
    node.send([msg, null]);

    return data;
  };
}

export function handleError(node: Node, msg: NodeMessage & { error?: AxiosError | Error }) {
  return (err: AxiosError | Error): void => {
    msg.error = err;

    node.status({ fill: 'red', shape: 'dot', text: 'error' });
    node.send([null, msg]);

    logApiError(node, err);
  };
}

export function logApiError(node: Node, err: AxiosError | Error): void {
  const info = extractAxiosErrorInfo(err);

  if (info) {
    const { data, method, status, url } = info;
    const payload = data ? `\n${JSON.stringify(data)}` : '';
    node.error(`${method} ${url} ${status}${payload}`);
  } else {
    // if error stack (including error message) exists use this otherwise ensure a string
    const text = typeof err.stack === 'string' ? err.stack : typeof err !== 'string' ? JSON.stringify(err) : err;
    node.error(text);
  }
}

export function extractAxiosErrorInfo(err: AxiosError | Error): IAxiosErrorInfo | null {
  if (!axios.isAxiosError(err)) {
    return null;
  }

  const { method = '', url, data } = err.config || {};
  return {
    url,
    data,
    method: method.toUpperCase(),
    status: err.response ? err.response.status : null,
  };
}

function evaluateMessageTenantPath(tenantPath: string, msg: Record<string, unknown>): unknown {
  return tenantPath.split('.').reduce<unknown>((obj, key) => {
    if (obj !== null && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, key)) {
      return (obj as Record<string, unknown>)[key];
    }
    return undefined;
  }, msg);
}
