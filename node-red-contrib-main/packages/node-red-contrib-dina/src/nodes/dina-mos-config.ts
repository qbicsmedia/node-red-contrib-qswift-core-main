import { Node, NodeAPI, NodeDef } from '@dina/lib/node-red';
import { EventEmitter } from '@dina/util/EventEmitter';
import WebSocket from 'ws';

export class MosConfig {
  private emitter: EventEmitter;
  private inputNodes: Node[] = [];
  constructor(emitter: EventEmitter) {
    this.emitter = emitter;
  }
  registerInputNode = (node: Node): void => {
    const index = this.inputNodes.indexOf(node);

    if (index === -1) {
      this.inputNodes.push(node);
    }
  };
  unregisterInputNode = (node: Node): void => {
    const index = this.inputNodes.indexOf(node);

    if (index > -1) {
      this.inputNodes.splice(index, 1);
    }
  };
  getEventEmitter = (): EventEmitter => {
    return this.emitter;
  };
  getInputNodes = (): Node[] => {
    return this.inputNodes;
  };
}

export interface IDinaMosConfigNode extends Node {
  socket: WebSocket;
  name: string;
  wsUrl: string;
  headers: string;
  mosConfig: MosConfig;
  injectMosConfig: (mosConfig: MosConfig) => void;
  reconnectInterval: number;
  reconnectTimeout: NodeJS.Timeout;
  closing: boolean;
}
export interface IDinaMosConfigNodeConfig extends NodeDef {
  name: string;
  wsUrl: string;
  headers: string;
}

export default function (RED: NodeAPI): void {
  function DinaMosConfig(this: IDinaMosConfigNode, config: IDinaMosConfigNodeConfig): void {
    RED.nodes.createNode(this, config);

    const node = this;

    node.name = config.name;
    node.wsUrl = config.wsUrl;
    node.headers = config.headers;

    node.reconnectInterval = 3000;
    node.reconnectTimeout = 0 as unknown as NodeJS.Timeout;
    node.closing = false;

    node.on('close', (callback: () => void) => {
      closeConnection(node, callback);
    });
    startConnection(node);
  }

  DinaMosConfig.prototype.injectMosConfig = function (mosConfig: MosConfig): void {
    this.mosConfig = mosConfig;
  };

  function startConnection(node: IDinaMosConfigNode): void {
    const options = {
      headers: parseJsonString(node.headers) ?? {},
    };
    node.socket = new WebSocket(node.wsUrl, [], options);
    node.socket.setMaxListeners(0);

    handleConnection(node);
  }
  function closeConnection(node: IDinaMosConfigNode, done: () => void): void {
    node.closing = true;
    node.socket.close();
    const closeMonitorInterval = 20;
    let closeMonitorCount = 50;
    const interval = setInterval(() => {
      if (node.socket.readyState === WebSocket.CLOSED || closeMonitorCount <= 0) {
        if (node.reconnectTimeout) {
          clearTimeout(node.reconnectTimeout);
          node.reconnectTimeout = 0 as unknown as NodeJS.Timeout;
        }
        clearInterval(interval);
        return done();
      }
      closeMonitorCount--;
    }, closeMonitorInterval);
  }

  function handleConnection(node: IDinaMosConfigNode): void {
    const socket: WebSocket = node.socket;
    const id = RED.util.generateId();

    socket.on('open', () => {
      node.mosConfig?.getEventEmitter().emit('opened', id);
    });

    socket.on('close', () => {
      node.mosConfig?.getEventEmitter().emit('closed', id);
      attemptReconnect(node);
    });

    socket.on('error', err => {
      node.mosConfig?.getEventEmitter().emit('error', JSON.stringify({ err, id }));
      attemptReconnect(node);
    });

    socket.on('message', data => {
      const payload = parseJsonString(data.toString());
      if (payload) {
        const msg = {
          _session: { type: 'websocket', id },
          payload,
        };
        node.mosConfig.getInputNodes().forEach(inputNode => inputNode.send(msg));
      }
    });
  }

  function attemptReconnect(node: IDinaMosConfigNode): void {
    if (!node.closing) {
      clearTimeout(node.reconnectTimeout);
      node.reconnectTimeout = setTimeout(() => startConnection(node), node.reconnectInterval);
    }
  }

  function parseJsonString(jsonString: string): string | null {
    try {
      return typeof jsonString === 'string' && jsonString.trim().length > 0 ? JSON.parse(jsonString) : null;
    } catch (err) {
      return null;
    }
  }

  RED.nodes.registerType('dina-mos-config', DinaMosConfig);
}
