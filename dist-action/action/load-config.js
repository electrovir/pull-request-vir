"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = void 0;
const core_1 = require("@actions/core");
const core_2 = require("@swc/core");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const object_shape_tester_1 = require("object-shape-tester");
const path_1 = require("path");
const pull_request_vir_config_1 = require("../config/pull-request-vir-config");
async function loadConfig() {
    const configFilePath = (0, path_1.resolve)((0, core_1.getInput)('config-file') || './configs/internal-action.config.ts');
    if (!(0, fs_1.existsSync)(configFilePath)) {
        return pull_request_vir_config_1.defaultPullRequestVirConfig;
    }
    const outputPath = (0, path_1.join)(process.cwd(), 'node_modules', 'pull-request-vir', 'config-output.js');
    await (0, promises_1.mkdir)((0, path_1.dirname)(outputPath), { recursive: true });
    const output = await (0, core_2.transformFile)(configFilePath, {
        isModule: true,
        module: {
            type: 'commonjs',
        },
    });
    await (0, promises_1.writeFile)(outputPath, output.code);
    const config = (await import((0, path_1.join)('pull-request-vir', 'config-output.js'))).default.default;
    (0, object_shape_tester_1.assertValidShape)(config, pull_request_vir_config_1.pullRequestVirConfigShape);
    return config;
}
exports.loadConfig = loadConfig;
