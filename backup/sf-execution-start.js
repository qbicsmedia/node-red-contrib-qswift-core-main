const { startExecution } = require('../node-red-contrib-item-receiver/lib/sfnClient');

module.exports = function(RED) {
	function ExecutionStart(config) {
		RED.nodes.createNode(this, config);

		this.stateMachineArn = config.stateMachineArn;

		const node = this;

		node.on('input', handleMessage);

		async function handleMessage(msg) {
			const { payload, name, _taskToken } = msg;

			try {
				// NOTE: forward task token if execution is inside an activity
				if(typeof _taskToken === 'string') {
					payload.QSWIFT_ACTIVITY_TASK_TOKEN = _taskToken;
				}
				msg.result = await startExecution(node.stateMachineArn, name, payload);
				node.send([msg, null]);
			} catch(err) {
				node.send([null, err]);
			}
		}
	}

	RED.nodes.registerType('qswift-sf-execution-start', ExecutionStart);
};
