const { startExecution } = require('./lib/sfnClient');
const  axios = require('axios');

module.exports = function(RED) {
	function ExecutionSerial(config) {
		RED.nodes.createNode(this, config);

		this.workflowName = config.workflowName;

		const node = this;

		node.on('input', handleMessage);

		async function handleMessage(msg) {
			const { payload, name } = msg;

			try {
				payload.workflowName = node.workflowName
				const response = await axios.post('https://yfvlr1slhe.execute-api.eu-central-1.amazonaws.com/prod/sequentialWorkflow', payload);
			
			//	node.workflowName
				node.send(msg);
			} catch(err) {
				node.send(err);
			}
		}
	}

	RED.nodes.registerType('qswift-sf-execution-serial', ExecutionSerial);
};
