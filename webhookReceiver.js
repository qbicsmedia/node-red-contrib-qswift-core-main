const { Consumer } = require("sqs-consumer");
const { SQSClient } = require("@aws-sdk/client-sqs");

module.exports = function(RED) {
  function LongPollingSQS(config) {
    RED.nodes.createNode(this, config);
    const node = this; // Capture the current node context
    node.sqsArn = `${config.sqsArn}`;

    // Start listening for messages
    listenForMessages();

    function listenForMessages() {

      const sqsClient = new SQSClient({
        region: 'eu-central-1',  // Replace with your AWS region
        endpoint: node.sqsArn,    // Use the queue URL as the endpoint
        useQueueUrlAsEndpoint: true
      });
      
      const app = Consumer.create({
        queueUrl: node.sqsArn,
        sqs : sqsClient,
        handleMessage: async (message) => {
      
          try {
            let msg = {}

            msg.payload = { ...JSON.parse(message.Body) };
            node.send([msg, null]);
          } catch (error) {
            msg.payload = message
            node.send([null,msg]);
          } 
           // Send the message on the first output
        },
      });
    

      // Handle errors
      app.on("error", (err) => {
        const errorMsg = { payload: err.message };
        node.send([null, errorMsg]); // Send errors on the second output
      });

      app.on("processing_error", (err) => {
        const errorMsg = { payload: err.message };
        node.send([null, errorMsg]); // Send processing errors on the second output
      });

      app.start();

      // Ensure cleanup on node shutdown
      node.on('close', function() {
        app.stop();
      });
    }
  }

  RED.nodes.registerType("webhookReceiver", LongPollingSQS);
};