import { AxiosError, RawAxiosRequestHeaders } from 'axios';
import { Node, NodeAPI, NodeDef, NodeMessageInFlow } from 'node-red';

import { MimirApiRequest } from '../lib/MimirApiRequest';
import { createApiRequestConfigFromConfigNode, evaluateTenant, handleError, handleSuccess } from '../lib/api';
import { IMimirHostNode } from './mimir-host';

export interface IMimirHttpRequestNode extends Node {
  api: string;
  method: string;
  path: string;
  variables: IVariableItem[];
  complete: string;
  tenantPath: string;
  tenantPathType: string;
  verboseLogging: boolean;
}

export interface IMimirHttpRequestNodeConfig extends NodeDef {
  host: string;
  api: string;
  method: string;
  path: string;
  variables: IVariableItem[];
  complete: string;
  tenantPath: string;
  tenantPathType: string;
  verboseLogging: boolean;
}

export interface IMimirHttpRequestNodeMessage extends NodeMessageInFlow {
  method?: string;
  path?: string;
  headers?: RawAxiosRequestHeaders;
  error?: AxiosError | Error;
  tenant?: string;
  [key: string]: unknown;
}

export interface IVariableItem {
  name: string;
  mappingType: string;
  mappingProperty: string;
}

interface IApiPartResult {
  method?: string;
  path?: string;
}

export default function (RED: NodeAPI): void {
  function MimirHttpRequestNode(this: IMimirHttpRequestNode, config: IMimirHttpRequestNodeConfig): void {
    RED.nodes.createNode(this, config);

    this.api = config.api;
    this.method = config.method;
    this.path = config.path;
    this.variables = config.variables;
    this.complete = config.complete;
    this.tenantPath = config.tenantPath;
    this.tenantPathType = config.tenantPathType;
    this.verboseLogging = config.verboseLogging;

    const node = this;
    const mimirHostConfig = RED.nodes.getNode(config.host) as IMimirHostNode;
    if (!mimirHostConfig) {
      node.error('No Mimir host config found!');
      return;
    }

    node.status({ fill: 'grey', shape: 'dot', text: 'ready' });
    node.on('input', handleMessage);

    async function handleMessage(_msg: unknown): Promise<void> {
      const msg = _msg as IMimirHttpRequestNodeMessage;
      const tenant = await evaluateTenant(node, msg);
      const apiRequestConfig = createApiRequestConfigFromConfigNode(mimirHostConfig);
      const apiRequest = new MimirApiRequest(apiRequestConfig, {
        tenant: tenant,
        headers: msg.headers,
        verboseLogging: node.verboseLogging,
        onRequestStart: (method: string, path: string): void => {
          node.status({ fill: 'blue', shape: 'dot', text: `${method} ${path}` });
        },
      });
      const { method, path } = getApiParts(node, msg);

      if (typeof method !== 'string' || typeof path !== 'string') {
        node.warn(`Invalid method/path configuration! (method: "${method}", path: "${path}")`);
        return;
      }

      apiRequest
        .request(method, path, msg.payload)
        .then(handleSuccess(node, msg, node.complete))
        .catch(handleError(node, msg));
    }
  }

  RED.nodes.registerType('mimir-httpRequest', MimirHttpRequestNode);

  function getApiParts(node: IMimirHttpRequestNode, msg: IMimirHttpRequestNodeMessage): IApiPartResult {
    if (node.api === 'message') {
      return {
        method: msg.method,
        path: msg.path,
      };
    }

    return {
      method: node.method,
      path: resolvePathVariables(node, msg),
    };
  }

  function resolvePathVariables(node: IMimirHttpRequestNode, msg: IMimirHttpRequestNodeMessage): string {
    let resolvedPath = node.path || '';

    (node.variables || []).forEach(({ name, mappingType, mappingProperty }) => {
      const placeholder = `{${name}}`;
      const value = RED.util.evaluateNodeProperty(mappingProperty, mappingType, node, msg);

      resolvedPath = resolvedPath.replace(new RegExp(placeholder, 'g'), value);
    });

    return resolvedPath;
  }
}
