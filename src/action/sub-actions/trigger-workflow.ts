import {getInput} from '@actions/core';
import {context} from '@actions/github';
import {log} from '@augment-vir/node-js';
import {Octokit} from '@octokit/core';

export async function triggerWorkflow(octokit: Octokit, workflowFileName: string) {
    log.info(
        `Triggering workflow '${workflowFileName}' for '${context.repo.owner}/${context.repo.repo}/${context.ref}'...`,
    );
    await octokit.request('POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches', {
        owner: context.repo.owner,
        repo: context.repo.repo,
        workflow_id: workflowFileName,
        ref: getInput('branch-name'),
        headers: {
            'X-GitHub-Api-Version': '2022-11-28',
        },
    });
}
