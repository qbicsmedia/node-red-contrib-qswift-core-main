import { Node, NodeAPI, NodeDef, NodeMessageInFlow } from 'node-red';

import { MimirDownload, IMimirDownloadPayload, TMimirDownloadResult, TUrlType } from '../lib/MimirDownload';
import { handleSuccess, handleError } from '../lib/api';

export interface IMimirDownloadNode extends Node {
  urlType: TUrlType;
  transformEnabled: boolean;
  output: string;
}

export interface IMimirDownloadNodeConfig extends NodeDef {
  urlType: TUrlType;
  transformEnabled: boolean;
  output: string;
}

export interface IMimirDownloadNodeMessage extends NodeMessageInFlow {
  payload: IMimirDownloadPayload;
}

export interface IMimirDownloadNodeOutput {
  [key: string]: TMimirDownloadResult;
}

export default function (RED: NodeAPI): void {
  function MimirDownloadNode(this: IMimirDownloadNode, config: IMimirDownloadNodeConfig): void {
    RED.nodes.createNode(this, config);

    this.urlType = config.urlType;
    this.transformEnabled = config.transformEnabled;
    this.output = config.output;

    const node = this;
    const mimirDownload = new MimirDownload();

    node.status({ fill: 'grey', shape: 'dot', text: 'ready' });
    node.on('input', handleMessage);

    async function handleMessage(_msg: unknown): Promise<void> {
      const msg = _msg as IMimirDownloadNodeMessage & IMimirDownloadNodeOutput;
      const url = mimirDownload.extractUrl(msg.payload, node.urlType);

      if (typeof url !== 'string' || url.trim().length === 0) {
        node.error(`Url type "${node.urlType}" could not be extracted!`);
        return;
      }

      const languageCode = mimirDownload.extractLanguageCode(msg.payload, node.urlType);

      node.status({ fill: 'blue', shape: 'dot', text: `GET ${url}` });
      mimirDownload
        .download(url)
        .then(data => mimirDownload.transformData(data, node.urlType, node.transformEnabled, languageCode))
        .then(handleSuccess(node, msg, node.output))
        .catch(handleError(node, msg));
    }
  }

  RED.nodes.registerType('mimir-download', MimirDownloadNode);
}
