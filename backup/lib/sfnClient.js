const {
	SFNClient,
	ListStateMachinesCommand,
	ListExecutionsCommand,
	GetActivityTaskCommand,
	SendTaskFailureCommand,
	SendTaskHeartbeatCommand,
	SendTaskSuccessCommand,
	StartExecutionCommand,
	StopExecutionCommand,
	ListActivitiesCommand
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
	startExecution,
	stopExecution,
	stopAllExecutions,
	listRunningExecutions,
	listStateMachines,
	listActivities
};

async function listActivities() {
	const command = new ListActivitiesCommand({});
    return await client.send(command);

}

async function listStateMachines() {
	const command = new ListStateMachinesCommand({});
    return await client.send(command);

}


async function getActivityTask(activityArn, abortSignal) {
	const command = new GetActivityTaskCommand({ activityArn });
	return await client.send(command, { abortSignal });
}
async function listRunningExecutions(stateMachineArn, abortSignal) {
	const command = new ListExecutionsCommand({ stateMachineArn, statusFilter: "RUNNING"});
	 return await client.send(command, { abortSignal });
}


async function sendTaskFailure(taskToken, error, cause) {
	const command = new SendTaskFailureCommand({taskToken, error, cause });
	return await client.send(command);
}

async function sendTaskHeartbeat(taskToken) {
	const command = new SendTaskHeartbeatCommand({ taskToken });
	return await client.send(command);
}

async function sendTaskSuccess(taskToken, payload) {
	const command = new SendTaskSuccessCommand({taskToken, output: JSON.stringify(payload) });
	return await client.send(command);
}

async function startExecution(stateMachineArn, executionName, input) {
	const command = new StartExecutionCommand({ stateMachineArn, name: executionName, input: JSON.stringify(input) });
	return await client.send(command);
}

async function stopExecution(stateMachineArn, workflowExecutionName, input) {
	// List all running executions for the state machine
	const result = await listRunningExecutions(stateMachineArn);
  

	try {
	  // Loop through the executions and find the ones with the matching prefix
	  for (const execution of result.executions) {
		// Check if the executionArn includes the given workflowExecutionName
		if (execution.executionArn.includes(workflowExecutionName)) {
		  console.log(`Stopping execution: ${execution.executionArn}`);
  
		  // Create and send the StopExecutionCommand
		  const command = new StopExecutionCommand({
			executionArn: execution.executionArn,
			cause: JSON.stringify(input),
		  });
  
		  // Await the response from stopping the execution
		  const response = await client.send(command);
	//	  console.log(`Execution stopped: ${execution.executionArn}`, response);
		  return response;
		}
	  }
  
	  // console.log('All matching executions have been stopped.');
	} catch (err) {
	  console.error("Error stopping executions:", err);
	}
}
async function stopAllExecutions(input) {
	// List all running executions for the state machine
	const stateMachines = listStateMachines();
	stateMachines.forEach(stateMachine => {
		
	});
	let result = await listRunningExecutions(stateMachine);
	for (const execution of result.executions) {
		// Check if the executionArn includes the given workflowExecutionName
	
  
		  // Create and send the StopExecutionCommand
		  const command = new StopExecutionCommand({
			executionArn: execution.executionArn,
			cause: JSON.stringify(input),
		  });
  
		  // Await the response from stopping the execution
		  const response = await client.send(command);
	//	  console.log(`Execution stopped: ${execution.executionArn}`, response);
		  return response;
		
	  }

	try {
	  // Loop through the executions and find the ones with the matching prefix
	
  
	  // console.log('All matching executions have been stopped.');
	} catch (err) {
	  console.error("Error stopping executions:", err);
	}
}


		

  
