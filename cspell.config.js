const {baseConfig} = require('virmator/base-configs/base-cspell.js');

module.exports = {
    ...baseConfig,
    ignorePaths: [
        ...baseConfig.ignorePaths,
        '**/dist-action/',
    ],
    words: [
        ...baseConfig.words,
    ],
};
