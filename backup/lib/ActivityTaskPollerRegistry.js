const { EventEmitter } = require('events');

const ActivityTaskPoller = require('./ActivityTaskPoller');

class ActivityTaskPollerRegistry extends EventEmitter {
	constructor() {
		super();

		this._registry = {};
	}

	register(nodeId, activityArn) {
		const currentPoller = this._registry[nodeId];

		if(currentPoller) {
			// already correctly registered
			if(currentPoller.activityArn === activityArn) {
				return currentPoller.poll;
			}

			// unregister old one
			this.unregister(nodeId);
		}

		// register (new) one
		const poller = new ActivityTaskPoller(activityArn);
		this._registry[nodeId] = poller;
		this.emit('registered', nodeId, activityArn);

		poller.start();

		return poller.poll;
	}

	unregister(nodeId) {
		const poller = this._registry[nodeId];

		if(!poller) {
			return;
		}

		poller.stop();
		delete this._registry[nodeId];
		this.emit('unregistered', nodeId, poller.activityArn);
	}

	destroy() {
		Object.keys(this._registry).forEach((nodeId) => this._registry[nodeId].stop());
		this._registry = {};
		this.emit('destroyed');
	}
}

module.exports = ActivityTaskPollerRegistry;
