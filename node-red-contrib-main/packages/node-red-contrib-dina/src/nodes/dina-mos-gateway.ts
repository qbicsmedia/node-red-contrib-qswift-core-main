import { Node, NodeAPI, NodeDef } from '@dina/lib/node-red';
import { IDinaMosConfigNode, MosConfig } from '@dina/nodes/dina-mos-config';
import { EventEmitter } from '@dina/util/EventEmitter';

export interface IDinaMosGatewayNode extends Node {
  name: string;
}

export interface IDinaMosGatewayNodeConfig extends NodeDef {
  config: string;
}

export default function (RED: NodeAPI): void {
  function DinaMosGateway(this: IDinaMosGatewayNode, config: IDinaMosGatewayNodeConfig): void {
    RED.nodes.createNode(this, config);

    const node = this;

    const dinaMosConfigNode = RED.nodes.getNode(config.config) as IDinaMosConfigNode;
    if (!dinaMosConfigNode) {
      showStatusDisconnected();
      throw new Error('No Dina MOS config found!');
    }

    const eventEmitter = new EventEmitter();
    const mosConfig = new MosConfig(eventEmitter);
    dinaMosConfigNode.injectMosConfig(mosConfig);

    setup();
    node.on('close', () => teardown());

    function setup(): void {
      dinaMosConfigNode.mosConfig.registerInputNode(node);

      eventEmitter.on('opened', showStatusConnected);
      eventEmitter.on('closed', showStatusDisconnected);
      eventEmitter.on('error', showStatusDisconnected);
    }

    function teardown(): void {
      mosConfig.unregisterInputNode(node);

      eventEmitter.off('opened', showStatusConnected);
      eventEmitter.off('closed', showStatusDisconnected);
      eventEmitter.off('error', showStatusDisconnected);
    }

    function showStatusConnected(): void {
      node.status({ fill: 'green', shape: 'dot', text: 'connected' });
    }

    function showStatusDisconnected(): void {
      node.status({ fill: 'red', shape: 'ring', text: 'disconnected' });
    }
  }
  RED.nodes.registerType('dina-mos-gateway', DinaMosGateway);
}
