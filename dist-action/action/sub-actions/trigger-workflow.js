"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerWorkflow = void 0;
const core_1 = require("@actions/core");
const github_1 = require("@actions/github");
const node_js_1 = require("@augment-vir/node-js");
async function triggerWorkflow(octokit, workflowFileName) {
    node_js_1.log.info(`Triggering workflow '${workflowFileName}' for '${github_1.context.repo.owner}/${github_1.context.repo.repo}/${github_1.context.ref}'...`);
    await octokit.request('POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches', {
        owner: github_1.context.repo.owner,
        repo: github_1.context.repo.repo,
        workflow_id: workflowFileName,
        ref: (0, core_1.getInput)('branch-name'),
        headers: {
            'X-GitHub-Api-Version': '2022-11-28',
        },
    });
}
exports.triggerWorkflow = triggerWorkflow;
