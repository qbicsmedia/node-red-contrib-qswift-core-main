import { Node, NodeAPI, NodeDef } from 'node-red';

export interface IMimirHostNodeConfig extends NodeDef {
  baseUrl: string;
  customBaseUrls: IMimirHostNodeTenantCustomBaseUrl[];
}

export interface IMimirHostNodeCredentials {
  tenants: IMimirHostNodeTenant[];
}

export interface IMimirHostNodeTenant {
  name: string;
  apiKey: string;
}

export interface IMimirHostNodeTenantCustomBaseUrl {
  tenantName: string;
  baseUrl: string;
}

export interface IMimirHostNode extends Node<IMimirHostNodeCredentials> {
  baseUrl: string | null;
  customBaseUrls: IMimirHostNodeTenantCustomBaseUrl[];
}

export default function (RED: NodeAPI): void {
  function MimirHostNode(this: IMimirHostNode, config: IMimirHostNodeConfig): void {
    RED.nodes.createNode(this, config);

    this.name = config.name;
    this.baseUrl = getHostName(config.baseUrl);
    this.customBaseUrls = config.customBaseUrls;
  }

  RED.nodes.registerType('mimir-host', MimirHostNode, {
    credentials: {
      tenants: {
        type: 'text',
      },
    },
  });
}

function getHostName(urlString: string): string | null {
  return typeof urlString === 'string' ? new URL(urlString).origin : null;
}
