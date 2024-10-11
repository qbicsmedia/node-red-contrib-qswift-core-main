const ActivityTaskPollerRegistry = require('./lib/ActivityTaskPollerRegistry');

module.exports = function(RED) {
	const activityPoller = new ActivityTaskPollerRegistry();

	function ActivityStart(config) {
		RED.nodes.createNode(this, config);

		this.activityArn = config.activityArn;
		this.output = config.output;

		const node = this;
		const poll = activityPoller.register(node.id, node.activityArn);

		addPollEventListeners();
		updateStatus('grey', 'ready');

		node.on('close', (removed, done) => {
			removePollEventListeners();

			if(removed) {
				activityPoller.unregister(node.id);
			}

			done();
		});

		function onTask({ payload, taskToken }) {
			// NOTE: do not forward QSWIFT_ACTIVITY_TASK_TOKEN
			const { QSWIFT_ACTIVITY_TASK_TOKEN, ...cleanedPayload } = payload;
			node.debug(`-> task found: ${JSON.stringify(payload)}`);
			node.send({ [node.output]: cleanedPayload, _taskToken: taskToken });
		}

		function onNoTask() {
			node.trace(`-> no task found`);
		}

		function onPollStart() {
			node.debug(`-> task polling START -> node: ${node.id}`);
		}

		function onPollEnd() {
			node.debug(`-> task polling END -> node: (${node.id})`);
		}

		function onPollAbort() {
			node.debug(`-> task polling ABORT`);
		}

		function onPollError(err) {
			node.error(`-> task polling ERROR: ${err}`);
			updateStatus('red', `${err}`);
		}

		function addPollEventListeners() {
			poll.on('task', onTask);
			poll.on('notask', onNoTask);
			poll.on('start', onPollStart);
			poll.on('end', onPollEnd);
			poll.on('abort', onPollAbort);
			poll.on('error', onPollError);
		}

		function removePollEventListeners() {
			poll.off('task', onTask);
			poll.off('notask', onNoTask);
			poll.off('start', onPollStart);
			poll.off('end', onPollEnd);
			poll.off('abort', onPollAbort);
			poll.off('error', onPollError);
		}

		function updateStatus(color, text, shape = 'dot') {
			node.status({ fill: color, shape, text });
		}
	}

	RED.nodes.registerType('qswift-sf-activity-task-start', ActivityStart);
};
