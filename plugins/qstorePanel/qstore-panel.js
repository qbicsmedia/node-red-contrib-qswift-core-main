const { DynamoDBClient, ExecuteStatementCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;
const dynamoDbClient = new DynamoDBClient({
	region: AWS_REGION,
	credentials: {
		accessKeyId: AWS_ACCESS_KEY_ID,
		secretAccessKey: AWS_SECRET_ACCESS_KEY
	}
});

class QStorePanel {
	constructor(dbClient) {
		this.dbClient = dbClient;
		this.tableName = 'qStore';
		this.primaryTableColumn = 'name';
	}

	async fetchStoreEntries() {
		const Statement = `SELECT name FROM "${this.tableName}"`;
		const command = new ExecuteStatementCommand({ Statement });
		const { Items = [] } = await this.dbClient.send(command);

		return Items.map((item) => unmarshall(item)[this.primaryTableColumn]).sort();
	}

	async fetchStoreEntryPayload(name) {
		const input = {
			TableName: this.tableName,
			Key: marshall({
				[this.primaryTableColumn]: name
			})
		};
		const command = new GetItemCommand(input);
		const response = await this.dbClient.send(command);

		// return this.extractPayload(response);
		const { payload } = unmarshall(response.Item ?? {});

		return JSON.parse(payload);
	}

	extractPayload(response) {
		const { payload } = unmarshall(response.Item ?? {});
	
		try {
			return JSON.parse(payload);
		} catch(err) {
			throw err;
		}
	}
}

module.exports = function(RED) {
	const qStorePanel = new QStorePanel(dynamoDbClient);
	const routeAuthHandler = RED.auth.needsPermission('qstore-panel.read');

	RED.plugins.registerPlugin('qstore-panel-plugin', {
		onadd: function() {
			const apiRoot = '/qstore-panel/api';

			RED.httpAdmin.get(`${apiRoot}/names`, routeAuthHandler, async (req, res) => {
				try {
					const data = await qStorePanel.fetchStoreEntries();
					res.status(200).json(data);
				} catch(err) {
					res.status(500).json({ error: err });
				}
			});

			RED.httpAdmin.get(`${apiRoot}/names/:name`, routeAuthHandler, async (req, res) => {
				try {
					const name = req.params.name;

					if(typeof name === 'string') {
						const data = await qStorePanel.fetchStoreEntryPayload(name);
						res.status(200).json(data);
					} else {
						res.status(400).json(null);
					}
				} catch(err) {
					res.status(500).json({ error: err });
				}
			});
		}
	});
};
