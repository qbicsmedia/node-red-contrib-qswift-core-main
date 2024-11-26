module.exports = function(RED) {
	function HttpInAuthConfig(config) {
		RED.nodes.createNode(this,config);

		this.name = config.name;
		this.realm = config.realm;
	}

	RED.nodes.registerType('http-in-auth-config', HttpInAuthConfig, {
		credentials: {
			username: {
				type: 'text'
			},
			password: {
				type: 'text'
			}
		}
	});
};
