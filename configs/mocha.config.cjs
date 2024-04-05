const baseOptions = require('virmator/base-configs/base-mocharc.js');

/** @type {import('mocha').MochaOptions} */
const mochaConfig = {
    ...baseOptions,
    /**
     * Though tsx reports line numbers wrong for code coverage, we don't need coverage here and
     * `ts-node` fails to handle ESM modules.
     */
    require: ['tsx'],
};

module.exports = mochaConfig;
