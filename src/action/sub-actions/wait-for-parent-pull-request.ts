import {log} from '@augment-vir/common';
import {type ScriptParams} from '../../config/config.js';
import {type GithubPullRequest} from '../../data/github.js';
import {fetchGithubPullRequest} from '../../services/fetch-github-pull-request.js';
import {SilentError} from '../../silent.error.js';

export async function waitForParent({octokit, pullRequest, config}: Readonly<ScriptParams>) {
    if (!config.waitForParentPullRequest) {
        log.success('waitForParentPullRequest config is false, skipping parent PR check.');
        return;
    }

    const baseBranchName = pullRequest.base.ref;
    log.faint(`base branch: ${baseBranchName}`);
    const parentPullRequest: GithubPullRequest | undefined = await fetchGithubPullRequest(
        octokit,
        baseBranchName,
    );

    if (parentPullRequest) {
        log.error(`Waiting on parent PR: ${parentPullRequest.number}: ${parentPullRequest.title}`);
        throw new SilentError();
    } else {
        log.success('No parent PR found.');
    }
}
