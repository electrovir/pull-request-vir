import {log, type SelectFrom} from '@augment-vir/common';
import {type ScriptParams} from '../../config/config.js';
import {determineNewPullRequestBody} from './insert-code-owners.js';
import {
    determineBodyWithPrimaryReviewers,
    determinePrimaryReviewers,
} from './insert-primary-reviewers.js';

/**
 * Primary reviewers and code owners both live in the pull request's description, so they are
 * written in a single update to prevent one from clobbering the other.
 */
export async function updatePullRequestBody({
    config,
    octokit,
    pullRequest,
    codeOwners,
    repo,
    reviews,
}: Readonly<
    SelectFrom<
        ScriptParams,
        {
            repo: {
                owner: true;
                repo: true;
            };
            config: {
                assignToAuthor: true;
                insertCodeOwners: true;
                reviewRules: true;
            };
            octokit: true;
            pullRequest: {
                number: true;
                body: true;
                html_url: true;
                user: {
                    login: true;
                };
                assignees: {
                    login: true;
                };
            };
            reviews: true;
            codeOwners: true;
        }
    >
>): Promise<void> {
    const originalBody = pullRequest.body || '';

    const bodyWithPrimaryReviewers =
        determineBodyWithPrimaryReviewers({
            body: originalBody,
            primaryReviewers: determinePrimaryReviewers({
                config,
                pullRequest,
                reviews,
                codeOwners,
            }),
        }) ?? originalBody;

    const newBody = config.insertCodeOwners
        ? (determineNewPullRequestBody({
              author: pullRequest.user?.login,
              body: bodyWithPrimaryReviewers,
              codeOwners,
              pullRequestUrl: pullRequest.html_url,
          }) ?? bodyWithPrimaryReviewers)
        : bodyWithPrimaryReviewers;

    if (newBody === originalBody) {
        log.success('Pull request description is already up to date.');
        return;
    }

    await octokit.rest.pulls.update({
        owner: repo.owner,
        pull_number: pullRequest.number,
        repo: repo.repo,
        body: newBody,
    });

    log.success('Pull request description updated.');
}
