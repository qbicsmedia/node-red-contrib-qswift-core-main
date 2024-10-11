const { parse } = require('@aws-sdk/util-arn-parser');

module.exports = {
	parseArn
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
