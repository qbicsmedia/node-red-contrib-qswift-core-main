import { Node, NodeAPI, NodeDef } from '@dina/lib/node-red';
import { IDinaGraphQLConfigNode } from '@dina/nodes/dina-graphql-config';
import { IDinaHttpRequestNodeMessage } from '@dina/nodes/dina-http-request';
import { handleError, handleReady, handleStatus, handleSuccess } from '@dina/util/ApiNode';
import { DinaGraphQLRequest } from '@dina/util/DinaGraphQLRequest';

export interface IDinaGraphQLNode extends Node {
  output: string;
}
export interface IDinaGraphQLNodeConfig extends NodeDef {
  output: string;
  config: string;
}

export default function (RED: NodeAPI): void {
  function DinaGraphQL(this: IDinaGraphQLNode, config: IDinaGraphQLNodeConfig): void {
    RED.nodes.createNode(this, config);
    this.output = config.output;

    const node = this;
    const dinaGraphQLConfig = RED.nodes.getNode(config.config) as IDinaGraphQLConfigNode;

    if (!dinaGraphQLConfig) {
      throw new Error('No Dina graphql config found!');
    }

    const graphQLApi = new DinaGraphQLRequest(dinaGraphQLConfig);

    handleReady(node);
    node.on('input', handleMessage);

    function handleMessage(_msg: unknown): void {
      const msg = _msg as IDinaHttpRequestNodeMessage;
      const { payload } = msg;

      handleStatus(node, 'executing ...');

      graphQLApi
        .request(payload)
        .then(handleSuccess(node, msg, node.output))
        .catch(handleError(node, msg));
    }
  }
  RED.nodes.registerType('dina-graphql', DinaGraphQL);
}
