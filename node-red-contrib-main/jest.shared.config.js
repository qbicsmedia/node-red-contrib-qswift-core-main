module.exports = {
	clearMocks: true,
	collectCoverageFrom: ['src/**/*.ts'],
	transform: {
		'^.+\\.ts$': '@swc/jest'
	}
};
