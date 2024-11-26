import { NodeAPI, PluginDef, PluginDefinition } from '@node-red/registry';
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';

import { IAWSConfigNode } from '../nodes/aws-config';
import { createAWSClientOptions } from '../lib/util';

// NOTE: export default function does not work here (idk why)
module.exports = function (RED: NodeAPI): void {
  const Plugin: PluginDefinition<PluginDef> = {
    type: 'plugin',
    onadd: function () {
      const apiRoot = '/aws-editor';
      const routeAuthHandler = RED.auth.needsPermission('aws-editor.read');

      RED.httpAdmin.get(`${apiRoot}/bedrock/anthropic/models`, routeAuthHandler, async (req, res) => {
        try {
          const { config, region } = req.query;

          if (typeof config !== 'string') {
            throw new Error('Required query parameter "config" is invalid!');
          }

          const awsConfig = RED.nodes.getNode(config) as IAWSConfigNode;

          if (!awsConfig) {
            throw new Error('No aws-config found! Make sure an aws-config is set, the node is deployed and try again.');
          }

          const clientConfig = createAWSClientOptions(awsConfig);

          // bedrock client has to be initialized with the correct region
          if (typeof region === 'string' && region.trim().length > 0) {
            clientConfig.region = region;
          }

          const bedrockClient = new BedrockClient(clientConfig);
          const command = new ListFoundationModelsCommand({
            byProvider: 'Anthropic',
          });
          const { modelSummaries } = await bedrockClient.send(command);

          res.status(200).json(modelSummaries);
        } catch (err) {
          RED.log.error(err);
          res.status(500).json({ error: err });
        }
      });
    },
  };

  RED.plugins.registerPlugin('aws-editor-api-plugin', Plugin);
};
