import {log} from '@augment-vir/node-js';
import {GithubPullRequest} from '../../data/github';
import {fetchGithubPullRequest} from '../../services/fetch-github-pull-request';
import {SilentError} from '../../silent.error';
import {SubActionParams} from '../sub-action-params';

export async function waitForParent({octokit, pullRequest, config}: Readonly<SubActionParams>) {
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
        return;
    }
}
