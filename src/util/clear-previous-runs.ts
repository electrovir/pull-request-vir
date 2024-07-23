import {awaitedForEach} from '@augment-vir/common';
import {log} from '@augment-vir/node-js';
import {GithubRepo, Octokit} from '../data/github';

export async function clearPreviousRuns({
    branchName,
    currentRunId,
    octokit,
    repo,
    workflowName,
}: {
    branchName: string;
    currentRunId: number;
    octokit: Octokit;
    repo: GithubRepo;
    workflowName: string;
}) {
    const previousRuns = (
        await octokit.rest.actions.listWorkflowRuns({
            ...repo,
            branch: branchName,
            workflow_id: workflowName,
        })
    ).data.workflow_runs.filter((workflowRun) => workflowRun.id !== currentRunId);

    log.faint(`Found ${previousRuns.length} previous '${workflowName}' runs.`);
    log.faint(`Deleting them all now...`);

    await awaitedForEach(previousRuns, async (workflowRun) => {
        log.faint(`Deleting run ${workflowRun.id}...`);
        try {
            await octokit.rest.actions.deleteWorkflowRun({
                ...repo,
                run_id: workflowRun.id,
            });
        } catch {
            log.error(`Failed to delete run ${workflowRun.id}`);
        }
    });
    log.faint(`Finished deleting previous '${workflowName}' runs.`);
}
