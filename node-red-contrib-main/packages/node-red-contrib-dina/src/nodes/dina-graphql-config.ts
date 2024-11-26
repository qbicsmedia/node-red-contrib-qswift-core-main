import { Node, NodeAPI, NodeDef } from '@dina/lib/node-red';

export interface IDinaGraphQLConfigNode extends Node {
  name: string;
  endpoint: string;
  assumeRoleArn: string;
}

export interface IDinaGraphQLConfigNodeConfig extends NodeDef {
  name: string;
  endpoint: string;
  assumeRoleArn: string;
}

export default function (RED: NodeAPI): void {
  function DinaGraphQLConfig(this: IDinaGraphQLConfigNode, config: IDinaGraphQLConfigNodeConfig): void {
    RED.nodes.createNode(this, config);
    this.name = config.name;
    this.endpoint = config.endpoint;
    this.assumeRoleArn = config.assumeRoleArn;
  }

  RED.nodes.registerType('dina-graphql-config', DinaGraphQLConfig);
}
