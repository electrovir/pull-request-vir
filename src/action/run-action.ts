import {check} from '@augment-vir/assert';
import {
    awaitedBlockingMap,
    ensureError,
    extractErrorMessage,
    log,
    wait,
    type MaybePromise,
} from '@augment-vir/common';
import {GithubPullRequest} from '../data/github.js';
import {getCompleteReviewStatus} from '../data/reviews.js';
import {fetchGithubPullRequest} from '../services/fetch-github-pull-request.js';
import {SilentError} from '../silent.error.js';
import {clearPreviousRuns} from '../util/clear-previous-runs.js';
import {extractEnvVars} from '../util/extract-env-vars.js';
import {logJson} from '../util/log-json.js';
import {loadConfig} from './load-config.js';
import {SubActionParams} from './sub-action-params.js';
import {autoAssignAuthor} from './sub-actions/auto-assign-author.js';
import {blockNoMerge} from './sub-actions/block-no-merge.js';
import {checkPrimaryReviewers} from './sub-actions/check-primary-reviewers.js';
import {requireReviewers} from './sub-actions/require-reviewers.js';
import {waitForParent} from './sub-actions/wait-for-parent-pull-request.js';

/**
 * These are in order of least likely to fail to more likely to fail, so we can run as many of them
 * as possible before they fail.
 */
const subActions: ReadonlyArray<(params: SubActionParams) => MaybePromise<void>> = [
    autoAssignAuthor,
    blockNoMerge,
    requireReviewers,
    waitForParent,
    checkPrimaryReviewers,
];

async function runAction() {
    /**
     * Wait because GitHub is slow to update, which causes race conditions with this action being
     * triggered and it reading the data.
     */
    await wait({seconds: 10});

    try {
        const {branchName, currentRunId, octokit, repo, repoDir, workflowName} = extractEnvVars();

        await clearPreviousRuns({branchName, currentRunId, octokit, repo, workflowName});

        const config = await loadConfig(repoDir);

        const pullRequest: GithubPullRequest | undefined = await fetchGithubPullRequest(
            octokit,
            branchName,
        );

        if (pullRequest) {
            log.faint(`Using pull request #${pullRequest.number}: ${pullRequest.title}`);
        } else {
            throw new Error(`No pull request found for branch '${branchName}'`);
        }

        if (config.ignoreDraft && pullRequest.draft) {
            throw new Error('Aborting checks because Pull Request is a draft.');
        }

        const reviews = await getCompleteReviewStatus({octokit, pullRequest, repo});
        log.faint('current approvals');
        logJson(reviews, 'faint');

        const subActionParams: SubActionParams = {
            config,
            octokit,
            pullRequest,
            repo,
            repoDir,
            reviews,
        };

        const errors: Error[] = (
            await awaitedBlockingMap(subActions, async (subAction) => {
                try {
                    await subAction(subActionParams);
                    return undefined;
                } catch (error) {
                    log.error(extractErrorMessage(error));
                    return ensureError(error);
                }
            })
        ).filter(check.isTruthy);

        if (errors.length) {
            throw new SilentError();
        }

        log.faint('');
        log.success('pull-request-vir finished');
    } catch (error) {
        if (!(error instanceof SilentError)) {
            log.error(extractErrorMessage(error));
        }
        log.faint('');
        log.error('pull-request-vir failed');
        process.exit(1);
    }
}

await runAction();
