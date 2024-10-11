const { sendTaskFailure, sendTaskSuccess } = require('./lib/sfnClient');

module.exports = function(RED) {
	function ActivityComplete(config) {
		RED.nodes.createNode(this, config);

		this.output = config.output;

		const node = this;

		node.on('input', handleMessage);

		async function handleMessage(msg) {
			const { _taskToken, error, cause } = msg;

			try {
				if(config.result === 'success') {
					msg.result = await sendTaskSuccess(_taskToken, msg[node.output]);
				} else {
					msg.result = await sendTaskFailure(_taskToken, error, cause);
				}

				node.send([msg, null]);
			} catch(err) {
				msg.error = err;
				node.send([null, msg]);
			}
		}
	}

	RED.nodes.registerType('qswift-sf-activity-task-complete', ActivityComplete);
};
