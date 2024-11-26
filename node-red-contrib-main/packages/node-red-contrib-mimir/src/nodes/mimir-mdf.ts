import { Node, NodeAPI, NodeDef, NodeMessageInFlow } from 'node-red';
import { RawAxiosRequestHeaders } from 'axios';

import { MimirMdfRequest, IMimirMdfCreatePayload, IMimirMdfUpdatePayload } from '../lib/MimirMdfRequest';
import { createApiRequestConfigFromConfigNode, evaluateTenant, handleSuccess, handleError } from '../lib/api';
import { IMimirHostNode } from './mimir-host';

type TMimirMdfOperation = 'create' | 'delete' | 'retrieve' | 'retrieveAll' | 'update';

export interface IMimirMdfNode extends Node {
  operation: TMimirMdfOperation;
  output: string;
  tenantPath: string;
  tenantPathType: string;
  verboseLogging: boolean;
}

export interface IMimirMdfNodeConfig extends NodeDef {
  host: string;
  operation: TMimirMdfOperation;
  output: string;
  tenantPath: string;
  tenantPathType: string;
  verboseLogging: boolean;
}

interface IMimirMdfNodeMessage extends NodeMessageInFlow {
  headers?: RawAxiosRequestHeaders;
  [key: string]: unknown;
}

interface IMimirMdfNodeRetrieveMessageIn extends IMimirMdfNodeMessage {
  mdfId: string;
}

interface IMimirMdfNodeCreateMessageIn extends IMimirMdfNodeMessage {
  payload: IMimirMdfCreatePayload;
}

interface IMimirMdfNodeUpdateMessageIn extends IMimirMdfNodeMessage {
  mdfId: string;
  payload: IMimirMdfUpdatePayload;
}

interface IMimirMdfNodeDeleteMessageIn extends IMimirMdfNodeMessage {
  mdfId: string;
}

export default function (RED: NodeAPI): void {
  function MimirMdfNode(this: IMimirMdfNode, config: IMimirMdfNodeConfig): void {
    RED.nodes.createNode(this, config);

    this.operation = config.operation;
    this.output = config.output;
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
      const msg = _msg as IMimirMdfNodeMessage;
      const tenant = await evaluateTenant(node, msg);
      const apiRequestConfig = createApiRequestConfigFromConfigNode(mimirHostConfig);
      const mdfRequest = new MimirMdfRequest(apiRequestConfig, {
        tenant: tenant,
        headers: msg.headers,
        verboseLogging: node.verboseLogging,
        onRequestStart: (method: string, path: string): void => {
          node.status({ fill: 'blue', shape: 'dot', text: `${method} ${path}` });
        },
      });

      switch (node.operation) {
        case 'retrieveAll': {
          mdfRequest
            .retrieveAll()
            .then(handleSuccess(node, msg, node.output))
            .catch(handleError(node, msg));
          break;
        }
        case 'retrieve': {
          const { mdfId } = msg as IMimirMdfNodeRetrieveMessageIn;
          mdfRequest
            .retrieve(mdfId)
            .then(handleSuccess(node, msg, node.output))
            .catch(handleError(node, msg));
          break;
        }
        case 'create': {
          const { payload } = msg as IMimirMdfNodeCreateMessageIn;
          mdfRequest
            .create(payload)
            .then(handleSuccess(node, msg, node.output))
            .catch(handleError(node, msg));
          break;
        }
        case 'update': {
          const { mdfId, payload } = msg as IMimirMdfNodeUpdateMessageIn;
          mdfRequest
            .update(mdfId, payload)
            .then(handleSuccess(node, msg, node.output))
            .catch(handleError(node, msg));
          break;
        }
        case 'delete': {
          const { mdfId } = msg as IMimirMdfNodeDeleteMessageIn;
          mdfRequest
            .delete(mdfId)
            .then(handleSuccess(node, msg, node.output))
            .catch(handleError(node, msg));
          break;
        }
        default: {
          node.error(`Operation "${node.operation}" is not supported!`);
        }
      }
    }
  }

  RED.nodes.registerType('mimir-mdf', MimirMdfNode);
}
