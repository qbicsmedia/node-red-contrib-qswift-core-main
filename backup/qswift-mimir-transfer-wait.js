const { marshall } = require('@aws-sdk/util-dynamodb');
const { putItem } = require('../node-red-contrib-item-receiver/lib/dynamoDbClient');

module.exports = function(RED) {
	function QSwiftMimirTransferWait(config) {
		RED.nodes.createNode(this, config);

		this.output = config.output;

		const tableName = "MimirTransferTable" ;//process.env.MIMIR_TRANSFER_TABLE;
		const node = this;

		node.on('input', handleMessage);

		async function handleMessage(msg) {
			const { _taskToken, payload } = msg;
			const { externalId, itemId } = payload ?? {};

			const input = {
				TableName: tableName,
				Item: marshall({
					taskToken: _taskToken,
					externalId,
					itemId,
					createdAt: Date.now(),
					completed: 0
				})
			};

			try {
				msg.result = await putItem(input);
				node.send([msg, null]);
			} catch(err) {
				msg.error = err;
				node.send([null, msg]);
			}
		}
	}

	RED.nodes.registerType('qswift-mimir-transfer-wait', QSwiftMimirTransferWait);
};
