import { Node, NodeAPI, NodeDef } from '@dina/lib/node-red';

export interface IDinaConfigNodeCredentials {
  apiKey: string;
}
export interface IDinaConfigNode extends Node<IDinaConfigNodeCredentials> {
  name: string;
  baseUrl: string;
}

export interface IDinaConfigNodeConfig extends NodeDef {
  name: string;
  baseUrl: string;
}

export default function (RED: NodeAPI): void {
  function DinaConfigNode(this: IDinaConfigNode, config: IDinaConfigNodeConfig): void {
    RED.nodes.createNode(this, config);
    this.name = config.name;
    this.baseUrl = config.baseUrl;
  }

  RED.nodes.registerType('dina-config', DinaConfigNode, {
    credentials: {
      apiKey: {
        type: 'text',
      },
    },
  });
}
