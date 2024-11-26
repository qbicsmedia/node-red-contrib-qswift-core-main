module.exports = function(RED) {
	function HttpInAuth(config) {
		RED.nodes.createNode(this, config);

		const node = this;
		const authConfig = RED.nodes.getNode(config.config);

		if(!authConfig) {
			throw new Error('No http-in-auth-config found!');
		}

		node.on('input', handleMessage);

		async function handleMessage(msg) {
			const { req, res } = msg;

			const authHeader = req.get('Authorization');
			const authHeaderMatches = authHeader ? authHeader.match(/^(\w+) (.*)$/) : [];
			const isBasicAuth = authHeaderMatches && authHeaderMatches[1] === 'Basic';

			if(isBasicAuth) {
				const authString = authHeaderMatches.length > 2 ? authHeaderMatches[2] : null;

				if(typeof authString === 'string') {
					const { credentials } = authConfig;
					const { username, password } = decodeBasicAuthString(authString);

					if(credentials.username === username && credentials.password === password) {
						node.send([msg, null]);
					} else {
						// add additional infos (beside error text)
						msg.error = `Invalid credentials for "${username}"!`;
						msg.ipAddress = req.headers['x-real-ip'];
						msg.url = req.url || req.originalUrl;

						requestBasicAuth(res);
						node.send([null, msg]);
					}
				} else {
					requestBasicAuth(res);
				}
			} else {
				requestBasicAuth(res);
			}
		}

		function requestBasicAuth(res) {
			// NOTE: calling methods on res alone will result in deprecation warnings therefore wrapper is used
			res._res.set('WWW-Authenticate', `Basic realm="${authConfig.realm || ''}"`);
			res._res.type('text/plain');
			res._res.status(401).send('401 Unauthorized');
		}

		function decodeBasicAuthString(authString) {
			const decodedAuthString = Buffer.from(authString, 'base64').toString();
			const [username, password] = decodedAuthString.split(':');

			return { username, password };
		}
	}

	RED.nodes.registerType('http-in-auth', HttpInAuth);
};
