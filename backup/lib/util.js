const { parse } = require('@aws-sdk/util-arn-parser');

module.exports = {
	parseArn,
	updateNodeStatus
};

function parseArn(arn) {
	const parsed = parse(arn);

	return {
		...parsed,
		...splitResource(parsed.resource)
	};
}

function splitResource(resource) {
	const separator = resource.includes('/') ? '/' : ':';
	const parts = resource.split(separator);
	const [resourceType, ...resourceId] = parts;

	return parts.length > 0 ? { resourceType, resourceId: resourceId.join('') } : {};
}
function updateNodeStatus(node, color, shape, statusText ) {
      
	const now = new Date(Date.now());
	const formattedDate = now.toLocaleString('us-US', {
	  year: 'numeric',
	  month: '2-digit',
	  day: '2-digit',
	  hour: '2-digit',
	  minute: '2-digit',
	  second: '2-digit',
	  hour12: false // for 24-hour format
	});
	let nodeStatusText = `${formattedDate} ${statusText}` 
	node.status({ fill: color, shape, text: nodeStatusText });
}
