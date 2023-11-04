"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerWorkflow = void 0;
const github_1 = require("@actions/github");
const node_js_1 = require("@augment-vir/node-js");
async function triggerWorkflow(octokit, workflowFileName) {
    node_js_1.log.info(`Triggering workflow '${workflowFileName}' for '${github_1.context.repo.owner}/${github_1.context.repo.repo}/${github_1.context.ref}'...`);
    await octokit.request(`POST /repos/${github_1.context.repo.owner}/${github_1.context.repo.repo}/actions/workflow/${workflowFileName}/dispatches`, {
        ref: github_1.context.ref,
    });
}
exports.triggerWorkflow = triggerWorkflow;
