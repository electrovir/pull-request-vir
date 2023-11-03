"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAction = void 0;
const core_1 = require("@actions/core");
const common_1 = require("@augment-vir/common");
const node_js_1 = require("@augment-vir/node-js");
const setup_git_1 = require("../util/setup-git");
const load_config_1 = require("./load-config");
const apply_formatting_1 = require("./sub-actions/apply-formatting");
async function runAction() {
    try {
        const config = await (0, load_config_1.loadConfig)();
        node_js_1.log.faint('received config:');
        node_js_1.log.faint(JSON.stringify(config, null, 4));
        const git = await (0, setup_git_1.setupGit)();
        const cwd = process.cwd();
        if (config.applyFormatting?.command) {
            await (0, apply_formatting_1.applyFormatting)(git, config.applyFormatting.command, cwd);
        }
    }
    catch (error) {
        node_js_1.log.error(error);
        (0, core_1.setFailed)((0, common_1.extractErrorMessage)(error));
    }
}
exports.runAction = runAction;
