import { Node, NodeAPI, NodeDef, NodeMessageInFlow } from 'node-red';

import { MimirApiRequest } from '../lib/MimirApiRequest';
import { createApiRequestConfigFromConfigNode, evaluateTenant, handleSuccess, handleError } from '../lib/api';
import { IMimirHostNode } from './mimir-host';

export interface IMimirRetrieveItemsNode extends Node {
  output: string;
  outputAsList: boolean;
  tenantPath: string;
  tenantPathType: string;
}

export interface IMimirRetrieveItemsNodeConfig extends NodeDef {
  host: string;
  output: string;
  outputAsList: boolean;
  tenantPath: string;
  tenantPathType: string;
}

export interface IMimirRetrieveItemsNodeMessage extends NodeMessageInFlow {
  itemIds: string[];
  tenant?: string;
}

export type TMimirRetrieveItemsNodeResult = IGenericMimirItem[] | IMimirItemMapping;

export interface IMimirRetrieveItemsNodeOutput {
  [key: string]: TMimirRetrieveItemsNodeResult;
}

export interface IMimirItemMapping {
  [key: string]: IGenericMimirItem;
}

export interface IGenericMimirItem extends Record<string, unknown> {
  id: string;
}

export default function (RED: NodeAPI): void {
  function MimirRetrieveItemsNode(this: IMimirRetrieveItemsNode, config: IMimirRetrieveItemsNodeConfig): void {
    RED.nodes.createNode(this, config);

    this.output = config.output;
    this.outputAsList = config.outputAsList;
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
      const msg = _msg as IMimirRetrieveItemsNodeMessage & IMimirRetrieveItemsNodeOutput;
      const { itemIds } = msg;

      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        node.error('"itemIds" is either not an array or it is empty.');
        return;
      }

      const tenant = await evaluateTenant(node, msg);
      const apiRequestConfig = createApiRequestConfigFromConfigNode(mimirHostConfig);
      const apiRequest = new MimirApiRequest(apiRequestConfig, {
        tenant: tenant,
      });

      node.status({ fill: 'blue', shape: 'dot', text: `fetch items (${itemIds.length})` });
      Promise.all(
        itemIds.map(itemId =>
          apiRequest.request<IGenericMimirItem>('GET', `/api/v1/items/${itemId}?readableMetadataFields=true`),
        ),
      )
        .then(list => (node.outputAsList ? list : createMapping(list)))
        .then(handleSuccess<TMimirRetrieveItemsNodeResult>(node, msg, node.output))
        .catch(handleError(node, msg));
    }

    function createMapping(list: IGenericMimirItem[]): IMimirItemMapping {
      return list.reduce((memo, item) => {
        memo[item.id] = item;
        return memo;
      }, {} as IMimirItemMapping);
    }
  }

  RED.nodes.registerType('mimir-retrieve-items', MimirRetrieveItemsNode);
}
