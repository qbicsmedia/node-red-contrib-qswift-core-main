import { Node, NodeAPI, NodeDef, NodeMessageInFlow } from 'node-red';

import { createTextList } from '../lib/textSplitter';

export interface ITextSplitterNode extends Node {
  maxChunkChars: number;
  output: string;
}

interface ITextSplitterNodeConfig extends NodeDef {
  maxChunkChars: number;
  output: string;
}

export interface ITextSplitterNodeMessage extends NodeMessageInFlow {
  payload: string;
  [key: string]: unknown;
}

export default function (RED: NodeAPI): void {
  function TextSplitterNode(this: ITextSplitterNode, config: ITextSplitterNodeConfig): void {
    RED.nodes.createNode(this, config);

    this.maxChunkChars = config.maxChunkChars;
    this.output = config.output;

    const node = this;

    node.on('input', handleMessage);

    async function handleMessage(_msg: unknown): Promise<void> {
      const msg = _msg as ITextSplitterNodeMessage;
      msg[node.output] = createTextList(msg.payload, node.maxChunkChars);
      node.send(msg);
    }
  }

  RED.nodes.registerType('text-splitter', TextSplitterNode);
}
