import {context} from '@actions/github';
import {log} from '@augment-vir/node-js';
import {Octokit} from '@octokit/core';

export async function triggerWorkflow(octokit: Octokit, workflowFileName: string) {
    log.info(
        `Triggering workflow '${workflowFileName}' for '${context.repo.owner}/${context.repo.repo}/${context.ref}'...`,
    );
    await octokit.request(
        `POST /repos/${context.repo.owner}/${context.repo.repo}/actions/workflow/${workflowFileName}/dispatches`,
        {
            ref: context.ref,
        },
    );
}
