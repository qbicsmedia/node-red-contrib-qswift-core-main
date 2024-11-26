const { startExecution, listStateMachines } = require('../node-red-contrib-item-receiver/lib/sfnClient');
const { serialItemProcessingLambda } = require('../node-red-contrib-item-receiver/lib/lambdaTrigger');
const  axios = require('axios');

module.exports = function(RED) {
	function ExecutionSerial(config) {
		RED.nodes.createNode(this, config);

		this.workflowName = config.workflowName;

		const node = this;

		const apiRoot = '/awsArns';
        // Register a route to handle the request from the HTML frontend
        RED.httpAdmin.get(`${apiRoot}/listStateMachines`, async (req, res) => {
          
          try {
            const data = await listSfWorkflows(); 
            res.status(200).json(data);
          } catch(err) {
            res.status(500).json({ error: err });
          }
      });

		node.on('input', handleMessage);

		async function handleMessage(msg) {
			const { payload, name } = msg;
			if (!this.workflowName || !payload.item.hasOwnProperty("id")) {
				msg.error = "workflowName or id not set";

				node.send(msg);
			} else {
				try {
					let lambdaEvt = {
						workflowName: this.workflowName,
						payload
					};
					console.log(lambdaEvt)
			
					// If serialItemProcessingLambda is an async function, ensure it is awaited.
					await serialItemProcessingLambda(lambdaEvt);
			
					// Optionally include the response handling code, if needed.
					// const response = await axios.post('https://yfvlr1slhe.execute-api.eu-central-1.amazonaws.com/prod/sequentialWorkflow', payload);
					
					node.send(msg); // Assuming msg is updated within the try block.
				} catch (err) {
					msg.error = err.message || err; // Send the error message.
					node.send(msg);
				}
			}

			
		}
	}

	RED.nodes.registerType('qswift-sf-execution-serial', ExecutionSerial);
};


async function listSfWorkflows() {

  
	try {

		// Send the command to  SF
		const data = await listStateMachines();
		
		// Output the queue URLs
	//    console.log('SQS Queue URLs:', data.QueueUrls || []);
		return data || [];
	} catch (error) {
  //      console.error('Error listing SQS queues:', error);
		throw error;
	}
  }