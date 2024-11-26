const { SQSClient, ListQueuesCommand } = require("@aws-sdk/client-sqs");
const { Consumer } = require("sqs-consumer");

const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;


module.exports = {
	listQueues,
	Consumer,
	SQSClient
};


async function listQueues() {
	// Create a new SQS client
  const sqsClient = new SQSClient();
  
	try {
		// Create a command object
		const command = new ListQueuesCommand({});
		
		// Send the command to the SQS client
		const data = await sqsClient.send(command);
		
		// Output the queue URLs
	//    console.log('SQS Queue URLs:', data.QueueUrls || []);
		return data.QueueUrls || [];
	} catch (error) {
  //      console.error('Error listing SQS queues:', error);
		throw error;
	}
  }
