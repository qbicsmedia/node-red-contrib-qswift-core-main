const { sendTaskHeartbeat } = require('../node-red-contrib-item-receiver/lib/sfnClient');

module.exports = function(RED) {
	function ActivityHeartbeat(config) {
		RED.nodes.createNode(this, config);

		const node = this;

		node.on('input', handleMessage);

		async function handleMessage(msg) {
			const { _taskToken } = msg;

			if(typeof _taskToken === 'string') {
				try {
					msg.heartbeat = await sendTaskHeartbeat(_taskToken);
					node.send([msg, null]);
				} catch(err) {
					msg.error = err;
					node.send([null, msg]);
				}
			}
		}
	}

	RED.nodes.registerType('qswift-sf-activity-task-heartbeat', ActivityHeartbeat);
};
