const { Consumer } = require("sqs-consumer");


module.exports = function(RED) {
	function LongPollingSQS(config) {
		RED.nodes.createNode(this, config);
        const node = this;
        const app = Consumer.create({
            queueUrl:  config.sqsArn,
            handleMessage: async (message) => {
                msg.payload = message
                node.send([msg, null]);
             
            },
          });
          
          
          app.on("error", (err) => {
            node.send([null, err.message])
          });
          
          app.on("processing_error", (err) => {
            node.send([null, err.message])
          });
          
          app.start();
          		
	}

	RED.nodes.registerType('webhookReceiver', LongPollingSQS);
};
