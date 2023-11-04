"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAction = void 0;
const core_1 = require("@actions/core");
const common_1 = require("@augment-vir/common");
const node_js_1 = require("@augment-vir/node-js");
const core_2 = require("@octokit/core");
const setup_git_1 = require("../util/setup-git");
const load_config_1 = require("./load-config");
const apply_formatting_1 = require("./sub-actions/apply-formatting");
const trigger_workflow_1 = require("./sub-actions/trigger-workflow");
async function runAction() {
    try {
        const config = await (0, load_config_1.loadConfig)();
        const git = await (0, setup_git_1.setupGit)();
        const cwd = process.cwd();
        const octokit = new core_2.Octokit({
            auth: (0, core_1.getInput)('token'),
        });
        if (config.applyFormatting?.command) {
            await (0, apply_formatting_1.applyFormatting)(git, config.applyFormatting.command, cwd);
        }
        /** This sub action should always go last. */
        if (config.triggerWorkflow?.fileName) {
            await (0, trigger_workflow_1.triggerWorkflow)(octokit, config.triggerWorkflow.fileName);
        }
    }
    catch (error) {
        node_js_1.log.error(error);
        (0, core_1.setFailed)((0, common_1.extractErrorMessage)(error));
    }
}
exports.runAction = runAction;
