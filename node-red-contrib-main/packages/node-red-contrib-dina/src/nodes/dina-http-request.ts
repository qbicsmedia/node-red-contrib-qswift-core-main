import { Node, NodeAPI, NodeDef, NodeMessageInFlow } from '@dina/lib/node-red';
import { IDinaConfigNode } from '@dina/nodes/dina-config';
import { handleError, handleReady, handleStatus, handleSuccess } from '@dina/util/ApiNode';
import { DinaApiRequest } from '@dina/util/DinaApiRequest';

export interface IDinaHttpRequestNode extends Node {
  output: string;
}

export interface IDinaHttpRequestNodeConfig extends NodeDef {
  output: string;
  config: string;
}

export interface IDinaHttpRequestNodeMessage extends NodeMessageInFlow {
  payload: {
    method: string;
    path: string;
    payload?: object;
  };
  [key: string]: unknown;
}

export default function (RED: NodeAPI): void {
  function DinaHttpRequest(this: IDinaHttpRequestNode, config: IDinaHttpRequestNodeConfig): void {
    RED.nodes.createNode(this, config);

    this.output = config.output;

    const node = this;
    const dinaConfig = RED.nodes.getNode(config.config) as IDinaConfigNode;
    if (!dinaConfig) {
      throw new Error('No Dina config found!');
    }

    const dinaApi = new DinaApiRequest(dinaConfig);

    handleReady(node);

    node.on('input', handleMessage);

    async function handleMessage(_msg: unknown): Promise<void> {
      const msg = _msg as IDinaHttpRequestNodeMessage;
      const { method, path, payload } = msg.payload;

      const options = dinaApi.createOptions(method as string, path as string, payload);
      handleStatus(node, `${method} ${path}`);

      dinaApi
        .fetch(options)
        .then(handleSuccess(node, msg as IDinaHttpRequestNodeMessage, node.output))
        .catch(handleError(node, msg as IDinaHttpRequestNodeMessage));
    }
  }

  RED.nodes.registerType('dina-http-request', DinaHttpRequest);
}
