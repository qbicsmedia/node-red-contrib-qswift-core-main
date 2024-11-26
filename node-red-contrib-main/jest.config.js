const sharedConfig = require('./jest.shared.config');

module.exports = {
	...sharedConfig,
	roots: ['<rootDir>/'],
	coverageProvider: 'v8',
	moduleNameMapper: {
		'@dina/(.*)': '<rootDir>/packages/node-red-contrib-dina/src/$1'
	},
	collectCoverageFrom: ["<rootDir>/packages/**/*.{ts,tsx}"],

};
