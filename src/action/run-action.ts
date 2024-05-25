import {
    awaitedBlockingMap,
    combineErrors,
    ensureError,
    extractErrorMessage,
    isTruthy,
    wait,
} from '@augment-vir/common';
import {log} from '@augment-vir/node-js';
import {GithubPullRequest} from '../data/github';
import {fetchGithubPullRequest} from '../services/fetch-github-pull-request';
import {SilentError} from '../silent.error';
import {clearPreviousRuns} from '../util/clear-previous-runs';
import {extractEnvVars} from '../util/extract-env-vars';
import {loadConfig} from './load-config';
import {SubActionParams} from './sub-action-params';
import {autoAssignAuthor} from './sub-actions/auto-assign-author';
import {blockNoMerge} from './sub-actions/block-no-merge';
import {requireReviewers} from './sub-actions/require-reviewers';
import {waitForParent} from './sub-actions/wait-for-parent-pull-request';

/**
 * These are in order of least likely to fail to more likely to fail, so we can run as many of them
 * as possible before they fail.
 */
const subActions: ReadonlyArray<(params: SubActionParams) => Promise<void>> = [
    autoAssignAuthor,
    blockNoMerge,
    requireReviewers,
    waitForParent,
];

async function runAction() {
    /**
     * Wait because GitHub is slow to update, which causes race conditions with this action being
     * triggered and it reading the data.
     */
    await wait(10_000);

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

        const subActionParams: SubActionParams = {
            config,
            octokit,
            pullRequest,
            repo,
            repoDir,
        };

        const errors: Error[] = (
            await awaitedBlockingMap(subActions, async (subAction) => {
                try {
                    await subAction(subActionParams);
                    return undefined;
                } catch (error) {
                    return ensureError(error);
                }
            })
        ).filter(isTruthy);

        if (errors.length) {
            const errorsForMessage = errors.filter((error) => !(error instanceof SilentError));
            if (errorsForMessage.length) {
                throw combineErrors(errorsForMessage);
            } else {
                throw new SilentError();
            }
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

runAction();
