const { LambdaClient, InvokeCommand, ListFunctionsCommand } = require("@aws-sdk/client-lambda");


const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;


module.exports = {
	serialItemProcessingLambda
};

const lambdaClient = new LambdaClient();



async function serialItemProcessingLambda(payload) {

	try {


        // Create an InvokeCommand
        const command = new InvokeCommand({
            FunctionName: "ToSqs", // Replace with your Lambda function name
            Payload: JSON.stringify(payload), // Convert payload to a buffer
        });

        // Invoke the Lambda function
        const response = await lambdaClient.send(command);

        // Handle the response
        const responsePayload = Buffer.from(response.Payload).toString();
        console.log("Lambda Response:", responsePayload);
    } catch (error) {
        console.error("Error invoking Lambda function:", error);
    }
  }
