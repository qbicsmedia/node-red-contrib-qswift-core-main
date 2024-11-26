const ActivityTaskPollerRegistry = require('../node-red-contrib-item-receiver/lib/ActivityTaskPollerRegistry');
const { listActivities } = require('../node-red-contrib-item-receiver/lib/sfnClient');

module.exports = function(RED) {
	const activityPoller = new ActivityTaskPollerRegistry();

	function ActivityStart(config) {
		RED.nodes.createNode(this, config);

		this.activityArn = config.activityArn;
		this.output = config.output;

		const node = this;
		const apiRoot = '/awsArns';
        // Register a route to handle the request from the HTML frontend
        RED.httpAdmin.get(`${apiRoot}/listActivities`, async (req, res) => {
          
          try {
            const data = await listActivities(); 
            res.status(200).json(data);
          } catch(err) {
            res.status(500).json({ error: err });
          }
      });


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
			
			const we = payload.workflowExecution
			delete payload.workflowExecution;
		
		
			node.debug(`-> task found: ${JSON.stringify(payload)}`);
			node.send({ 
				...payload,
				_taskToken: taskToken,
				workflowExecution: we }
				);
		
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
