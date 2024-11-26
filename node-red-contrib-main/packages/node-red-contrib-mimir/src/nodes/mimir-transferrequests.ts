import { Node, NodeAPI, NodeDef, NodeMessageInFlow } from 'node-red';

import {
  MimirTransferRequest,
  IMimirTransferRequestCreatePayload,
  IMimirTransferRequestLockPayload,
  IMimirTransferRequestDeletePayload,
} from '../lib/MimirTransferRequest';
import { createApiRequestConfigFromConfigNode, evaluateTenant, handleSuccess, handleError } from '../lib/api';
import { IMimirHostNode } from './mimir-host';

type TMimirTransferRequestOperation = 'create' | 'delete' | 'get' | 'getAll' | 'lock';

export interface IMimirTransferRequestNode extends Node {
  operation: TMimirTransferRequestOperation;
  output: string;
  tenantPath: string;
  tenantPathType: string;
}

export interface IMimirTransferRequestNodeConfig extends NodeDef {
  host: string;
  operation: TMimirTransferRequestOperation;
  output: string;
  tenantPath: string;
  tenantPathType: string;
}

export interface IMimirTransferRequestNodeMessage extends NodeMessageInFlow {
  storageId: string;
  [key: string]: unknown;
}

export interface IMimirTransferRequestNodeCreateMessageIn extends IMimirTransferRequestNodeMessage {
  payload: IMimirTransferRequestCreatePayload;
}

export interface IMimirTransferRequestNodeGetMessageIn extends IMimirTransferRequestNodeMessage {
  transferRequestId: string;
}

export interface IMimirTransferRequestNodeLockMessageIn extends IMimirTransferRequestNodeMessage {
  transferRequestId: string;
  payload: IMimirTransferRequestLockPayload;
}

export interface IMimirTransferRequestNodeDeleteMessageIn extends IMimirTransferRequestNodeMessage {
  transferRequestId: string;
  payload: IMimirTransferRequestDeletePayload;
}

export default function (RED: NodeAPI): void {
  function MimirTransferRequestNode(this: IMimirTransferRequestNode, config: IMimirTransferRequestNodeConfig): void {
    RED.nodes.createNode(this, config);

    this.operation = config.operation;
    this.output = config.output;
    this.tenantPath = config.tenantPath;
    this.tenantPathType = config.tenantPathType;

    const node = this;
    const mimirHostConfig = RED.nodes.getNode(config.host) as IMimirHostNode;

    if (!mimirHostConfig) {
      node.error('No Mimir host config found!');
      return;
    }

    node.status({ fill: 'grey', shape: 'dot', text: 'ready' });
    node.on('input', handleMessage);

    async function handleMessage(_msg: unknown): Promise<void> {
      const msg = _msg as IMimirTransferRequestNodeMessage;
      const tenant = await evaluateTenant(node, msg);
      const apiRequestConfig = createApiRequestConfigFromConfigNode(mimirHostConfig);
      const transferRequest = new MimirTransferRequest(apiRequestConfig, {
        tenant: tenant,
        onRequestStart: (method: string, path: string): void => {
          node.status({ fill: 'blue', shape: 'dot', text: `${method} ${path}` });
        },
      });
      const { storageId } = msg;

      switch (node.operation) {
        case 'getAll': {
          transferRequest
            .getAll(storageId)
            .then(handleSuccess(node, msg, node.output))
            .catch(handleError(node, msg));
          break;
        }
        case 'get': {
          const { transferRequestId } = msg as IMimirTransferRequestNodeGetMessageIn;
          transferRequest
            .get(storageId, transferRequestId)
            .then(handleSuccess(node, msg, node.output))
            .catch(handleError(node, msg));
          break;
        }
        case 'create': {
          const { payload } = msg as IMimirTransferRequestNodeCreateMessageIn;
          transferRequest
            .create(storageId, payload)
            .then(handleSuccess(node, msg, node.output))
            .catch(handleError(node, msg));
          break;
        }
        case 'lock': {
          const { transferRequestId, payload } = msg as IMimirTransferRequestNodeLockMessageIn;
          transferRequest
            .lock(storageId, transferRequestId, payload)
            .then(handleSuccess(node, msg, node.output))
            .catch(handleError(node, msg));
          break;
        }
        case 'delete': {
          const { transferRequestId, payload } = msg as IMimirTransferRequestNodeDeleteMessageIn;
          transferRequest
            .delete(storageId, transferRequestId, payload)
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

  RED.nodes.registerType('mimir-transferRequests', MimirTransferRequestNode);
}
