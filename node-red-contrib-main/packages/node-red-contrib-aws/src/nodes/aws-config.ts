import { Node, NodeAPI, NodeDef } from 'node-red';

export interface IAWSConfigNode extends Node<IAWSConfigNodeCredentials> {
  name: string;
  region: string;
  authType: string;
}

export interface IAWSConfigNodeConfig extends NodeDef {
  name: string;
  region: string;
  authType: string;
}

export interface IAWSConfigNodeCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  assumeRoleArn: string;
}

export default function (RED: NodeAPI): void {
  function AWSConfigNode(this: IAWSConfigNode, config: IAWSConfigNodeConfig): void {
    RED.nodes.createNode(this, config);

    this.name = config.name;
    this.region = config.region;
    this.authType = config.authType;
  }

  RED.nodes.registerType('aws-config', AWSConfigNode, {
    credentials: {
      accessKeyId: {
        type: 'text',
      },
      secretAccessKey: {
        type: 'password',
      },
      assumeRoleArn: {
        type: 'text',
      },
    },
  });
}
