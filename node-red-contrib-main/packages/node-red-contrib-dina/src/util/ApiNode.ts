import { axios } from '@dina/lib/axios';
import { IDinaHttpRequestNode } from '@dina/nodes/dina-http-request';
import { AxiosError } from 'axios';
import { Node, NodeMessage } from 'node-red';

interface AxiosErrorInfo {
  data?: unknown;
  method: string;
  status: number | null;
  url?: string;
}

export const handleReady = (node: IDinaHttpRequestNode): void => {
  node.status({ fill: 'grey', shape: 'dot', text: 'ready' });
};

export const handleStatus = (node: IDinaHttpRequestNode, text: string): void => {
  node.status({ fill: 'blue', shape: 'dot', text });
};

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

export const handleError = (node: Node, msg: NodeMessage & { error?: AxiosError | Error }) => {
  return (err: AxiosError | Error): void => {
    msg.error = err;

    node.status({ fill: 'red', shape: 'dot', text: 'error' });
    node.send([null, msg]);

    logApiError(node, err);
  };
};

export const logApiError = (node: Node, err: AxiosError | Error): void => {
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
};

export const extractAxiosErrorInfo = (err: Error): AxiosErrorInfo | null => {
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
};
