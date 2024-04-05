import {getInput} from '@actions/core';
import {getOctokit, context as githubContext} from '@actions/github';
import {awaitedForEach, extractErrorMessage} from '@augment-vir/common';
import {log} from '@augment-vir/node-js';
import {existsSync} from 'node:fs';
import {GithubPullRequest} from '../data/github';
import {SilentError} from '../silent.error';
import {loadConfig} from './load-config';
import {SubActionParams} from './sub-action-params';
import {autoAssignAuthor} from './sub-actions/auto-assign-author';
import {blockNoMerge} from './sub-actions/block-no-merge';
import {requireReviewers} from './sub-actions/require-reviewers';

/**
 * These are in order of least likely to fail to more likely to fail, so we can run as many of them
 * as possible before they fail.
 */
const subActions: ReadonlyArray<(params: SubActionParams) => Promise<void>> = [
    autoAssignAuthor,
    blockNoMerge,
    requireReviewers,
];

async function runAction() {
    try {
        const repoDir = process.env.GITHUB_WORKSPACE;
        if (!repoDir || !existsSync(repoDir)) {
            throw new Error(`Invalid repo dir: ${repoDir}`);
        }
        log.faint(`repo dir: ${repoDir}`);

        const config = await loadConfig(repoDir);

        const token = getInput('token', {trimWhitespace: true});

        if (!token) {
            throw new Error('Missing token GitHub Action input.');
        }

        const branchName = getInput('branch', {trimWhitespace: true});

        if (!branchName) {
            throw new Error('Missing branch GitHub Action input.');
        }

        const octokit = getOctokit(token);

        const pullRequest: GithubPullRequest | undefined = (
            await octokit.rest.pulls.list({
                ...githubContext.repo,
                head: [
                    githubContext.repo.owner,
                    branchName,
                ].join(':'),
                state: 'open',
                sort: 'updated',
                direction: 'desc',
            })
        ).data[0];

        if (pullRequest) {
            log.faint(`Using pull request #${pullRequest.number}: ${pullRequest.title}`);
        } else {
            throw new Error(`No pull request found for branch '${branchName}'`);
        }

        const subActionParams: SubActionParams = {
            config,
            octokit,
            pullRequest,
            repo: githubContext.repo,
            repoDir,
        };

        await awaitedForEach(subActions, (subAction) => subAction(subActionParams));

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
