const {
	SFNClient,
	GetActivityTaskCommand,
	SendTaskFailureCommand,
	SendTaskHeartbeatCommand,
	SendTaskSuccessCommand,
	StartExecutionCommand
} = require('@aws-sdk/client-sfn');

const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;
const client = new SFNClient({
	region: AWS_REGION,
	accessKeyId: AWS_ACCESS_KEY_ID,
	secretAccessKey: AWS_SECRET_ACCESS_KEY
});

module.exports = {
	getActivityTask,
	sendTaskFailure,
	sendTaskHeartbeat,
	sendTaskSuccess,
	startExecution
};

async function getActivityTask(activityArn, abortSignal) {
	const command = new GetActivityTaskCommand({ activityArn });
	return await client.send(command, { abortSignal });
}

async function sendTaskFailure(taskToken, error, cause) {
	const command = new SendTaskFailureCommand({ taskToken, error, cause });
	return await client.send(command);
}

async function sendTaskHeartbeat(taskToken) {
	const command = new SendTaskHeartbeatCommand({ taskToken });
	return await client.send(command);
}

async function sendTaskSuccess(taskToken, payload) {
	const command = new SendTaskSuccessCommand({ taskToken, output: JSON.stringify(payload) });
	return await client.send(command);
}

async function startExecution(stateMachineArn, executionName, input) {
	const command = new StartExecutionCommand({ stateMachineArn, name: executionName, input: JSON.stringify(input) });
	return await client.send(command);
}
