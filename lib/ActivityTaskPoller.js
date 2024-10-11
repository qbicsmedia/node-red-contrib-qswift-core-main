const { EventEmitter } = require('events');

const { getActivityTask } = require('./sfnClient');

class ActivityTaskPoller {
	constructor(activityArn) {
		this.activityArn = activityArn;
		this.abortController = null;
		this.polling = false;
		this.poll = new EventEmitter();
	}

	start() {
		if(!this.polling) {
			this.polling = true;
			this._longPoll();
		}
	}

	stop() {
		if(this.polling) {
			this.polling = false;
			this.abortController?.abort();
		}
	}

	async _longPoll() {
		this.poll.emit('start');

		while(this.polling) {
			try {
				this.abortController = new AbortController();
				const task = await this._getActivityTask();
	
				if(task) {
					this.poll.emit('task', task);
				} else {
					this.poll.emit('notask');
				}
	
				if(this.abortController.signal.aborted) {
					this.poll.emit('end');
					break;
				}
			} catch(err) {
				if(err.name === 'AbortError') {
					this.poll.emit('abort');
				} else {
					this.poll.emit('error', err);
					// timeout to slow down error spamming
					await new Promise((resolve) => setTimeout(() => resolve(), 1000));
				}
			}
		}
	}

	async _getActivityTask() {
		if(this.abortController.signal.aborted) {
			return null;
		}

		const { input, taskToken } = await getActivityTask(this.activityArn, this.abortController.abortSignal);

		if(typeof taskToken !== 'string') {
			return null;
		}

		try {
			const payload = JSON.parse(input);
			return { payload, taskToken };
		} catch(err) {
			this.poll.emit('payloadError', err);
			return null;
		}
	}
}

module.exports = ActivityTaskPoller;
