import { Node, NodeAPI, NodeDef, NodeMessageInFlow } from 'node-red';

import {
  MimirItemAttachmentRequest,
  IMimirItemAttachmentCreatePayload,
  IMimirItemAttachmentUpdatePayload,
  IMimirItemAttachmentDeletePayload,
} from '../lib/MimirItemAttachmentRequest';
import { createApiRequestConfigFromConfigNode, evaluateTenant, handleSuccess, handleError } from '../lib/api';
import { IMimirHostNode } from './mimir-host';

type TMimirItemAttachmentOperation = 'create' | 'delete' | 'fetch' | 'getList' | 'update';

export interface IMimirItemAttachmentNode extends Node {
  operation: TMimirItemAttachmentOperation;
  forceOverwrite: boolean;
  output: string;
  tenantPath: string;
  tenantPathType: string;
}

export interface IMimirItemAttachmentNodeConfig extends NodeDef {
  host: string;
  operation: TMimirItemAttachmentOperation;
  forceOverwrite: boolean;
  output: string;
  tenantPath: string;
  tenantPathType: string;
}

export interface IMimirItemAttachmentNodeMessage extends NodeMessageInFlow {
  itemId: string;
  tenant?: string;
  [key: string]: unknown;
}

export interface IMimirItemAttachmentNodeFetchMessageIn extends IMimirItemAttachmentNodeMessage {
  attachment: string;
}

export interface IMimirItemAttachmentNodeCreateMessageIn extends IMimirItemAttachmentNodeMessage {
  payload: IMimirItemAttachmentCreatePayload;
  uploadContent: string | Buffer | Uint8Array;
}

export interface IMimirItemAttachmentNodeUpdateMessageIn extends IMimirItemAttachmentNodeMessage {
  payload: IMimirItemAttachmentUpdatePayload;
}

export interface IMimirItemAttachmentNodeDeleteMessageIn extends IMimirItemAttachmentNodeMessage {
  payload: IMimirItemAttachmentDeletePayload;
}

export default function (RED: NodeAPI): void {
  function MimirItemAttachmentNode(this: IMimirItemAttachmentNode, config: IMimirItemAttachmentNodeConfig): void {
    RED.nodes.createNode(this, config);

    this.operation = config.operation;
    this.forceOverwrite = config.forceOverwrite;
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
      const msg = _msg as IMimirItemAttachmentNodeMessage;
      const tenant = await evaluateTenant(node, msg);
      const apiRequestConfig = createApiRequestConfigFromConfigNode(mimirHostConfig);
      const itemAttachmentRequest = new MimirItemAttachmentRequest(apiRequestConfig, {
        tenant: tenant,
        onRequestStart: (method: string, path: string): void => {
          node.status({ fill: 'blue', shape: 'dot', text: `${method} ${path}` });
        },
      });

      switch (node.operation) {
        case 'getList': {
          const { itemId } = msg;
          itemAttachmentRequest
            .fetchList(itemId)
            .then(handleSuccess(node, msg, node.output))
            .catch(handleError(node, msg));
          break;
        }
        case 'fetch': {
          const { itemId, attachment } = msg as IMimirItemAttachmentNodeFetchMessageIn;
          itemAttachmentRequest
            .fetch(itemId, attachment)
            .then(handleSuccess(node, msg, node.output))
            .catch(handleError(node, msg));
          break;
        }
        case 'create': {
          const { itemId, payload, uploadContent } = msg as IMimirItemAttachmentNodeCreateMessageIn;
          itemAttachmentRequest
            .create(itemId, payload, uploadContent, node.forceOverwrite)
            .then(handleSuccess(node, msg, node.output))
            .catch(handleError(node, msg));
          break;
        }
        case 'update': {
          const { itemId, payload } = msg as IMimirItemAttachmentNodeUpdateMessageIn;
          itemAttachmentRequest
            .update(itemId, payload)
            .then(handleSuccess(node, msg, node.output))
            .catch(handleError(node, msg));
          break;
        }
        case 'delete': {
          const { itemId, payload } = msg as IMimirItemAttachmentNodeDeleteMessageIn;
          itemAttachmentRequest
            .delete(itemId, payload)
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

  RED.nodes.registerType('mimir-item-attachment', MimirItemAttachmentNode);
}
