const { stopExecution } = require('../node-red-contrib-item-receiver/lib/sfnClient');

module.exports = function(RED) {
	function ExecutionStop(config) {
		RED.nodes.createNode(this, config);

		this.stateMachineArn = config.stateMachineArn;

		const node = this;
	//	const reason = config.cause;
		node.on('input', handleMessage);

		async function handleMessage(msg) {
			const { payload, name, _taskToken, workflowExecution, reason } = msg;
			try {
				// NOTE: forward task token if execution is inside an activity
				if(typeof _taskToken === 'string') {
					payload.QSWIFT_ACTIVITY_TASK_TOKEN = _taskToken;
				}
			//	node.stateMachineArn
				msg.result = await stopExecution(workflowExecution.stateMachineArn, workflowExecution.name, reason || config.cause);
			//	stopAllExecutions
//				node.send([msg, null]);
			} catch(err) {
	//			node.send([null, err]);
			}
		}
	}

	RED.nodes.registerType('qswift-sf-execution-stop', ExecutionStop);
};