import { Node, NodeAPI, NodeDef, NodeMessageInFlow } from '@dina/lib/node-red';
import { ActiveRundown, ActiveRundownStore, Rundown, Story } from '@dina/util/ActiveRundownStore';

export interface IDinaRundownExportNode extends Node {
  output: string;
  timeout: number | null;
}

export interface IDinaRundownExportNodeConfig extends NodeDef {
  output: string;
  timeout: string;
}

export interface IDinaRundownExportNodeMessage extends NodeMessageInFlow {
  payload: {
    event: string;
    type: string;
    id: string;
    dependsOn: string;
    rundown: Rundown;
    story: Story;
  };
  [key: string]: unknown;
}

export default function (RED: NodeAPI): void {
  function DinaRundownExport(this: IDinaRundownExportNode, config: IDinaRundownExportNodeConfig): void {
    RED.nodes.createNode(this, config);

    this.timeout = parseTimeout(config.timeout);
    this.output = config.output;

    const node = this;

    node.on('input', handleMessage);
    addListener();
    node.on('close', () => removeListener());

    async function handleMessage(_msg: unknown): Promise<void> {
      const msg = _msg as IDinaRundownExportNodeMessage;
      const { event, type, id, dependsOn, rundown, story } = msg.payload;

      const activeRundownStore = new ActiveRundownStore();

      if (event === 'rundown') {
        if (type === 'create') {
          activeRundownStore.createRundown(id, rundown, msg, node.timeout);
        }

        if (type === 'delete') {
          activeRundownStore.removeRundown(id);
        }
      }

      if (event === 'story' && type === 'update') {
        activeRundownStore.updateStory(story, dependsOn);
      }
    }
    function addListener(): void {
      const activeRundownStore = new ActiveRundownStore();
      activeRundownStore.on('complete', sendExport);
      activeRundownStore.on('timeout', sendError);
      activeRundownStore.on('status', updateStatus);
    }

    function removeListener(): void {
      const activeRundownStore = new ActiveRundownStore();
      activeRundownStore.off('complete', sendExport);
      activeRundownStore.off('timeout', sendError);
      activeRundownStore.off('status', updateStatus);
    }

    function sendExport(activeRundown: ActiveRundown): void {
      const rundown = activeRundown.getRundown();
      const msg = {
        ...activeRundown.getMsg(),
        [node.output]: rundown,
      };

      node.log(`rundown successfully exported (${rundown.eventId}`);
      node.send([msg, null]);
    }

    function sendError(activeRundown: ActiveRundown): void {
      const rundown = activeRundown.getRundown();
      const msg = {
        error: new Error('Rundown export timed out'),
        rundown,
      };

      node.error(`rundown export timed out (${rundown.eventId}`);
      node.send([null, [msg as unknown as NodeMessageInFlow]]);
    }

    function updateStatus({ activeRundownCount }: { activeRundownCount: number }): void {
      if (activeRundownCount > 0) {
        node.status({ fill: 'green', shape: 'dot', text: `[${activeRundownCount}] exporting` });
      } else {
        node.status({});
      }
    }

    function parseTimeout(timeout: string): number | null {
      return /\d+/.test(timeout) ? parseInt(timeout, 10) : null;
    }
  }

  RED.nodes.registerType('dina-rundown-export', DinaRundownExport);
}
