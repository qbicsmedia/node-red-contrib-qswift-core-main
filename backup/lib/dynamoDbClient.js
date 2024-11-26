const { DynamoDBClient, ListTablesCommand, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;
const client = new DynamoDBClient({
	region: AWS_REGION,
	accessKeyId: AWS_ACCESS_KEY_ID,
	secretAccessKey: AWS_SECRET_ACCESS_KEY
});

module.exports = {
	putItem,
	listTables
};

async function putItem(input) {
	const command = new PutItemCommand(input);
	return await client.send(command);
}

async function listTables() {
	const command = new ListTablesCommand({});
	return await client.send(command);
}
