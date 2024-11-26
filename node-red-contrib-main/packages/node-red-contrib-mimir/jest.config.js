const sharedConfig = require('../../jest.shared.config');
const pkg = require('./package.json');

module.exports = {
  ...sharedConfig,
  displayName: pkg.name,
};
