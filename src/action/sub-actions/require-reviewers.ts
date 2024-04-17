import {
    awaitedBlockingMap,
    isTruthy,
    joinWithFinalConjunction,
    mapObjectValues,
    wait,
} from '@augment-vir/common';
import {log} from '@augment-vir/node-js';
import {createUtcFullDate, isDateAfter} from 'date-vir';
import {isRunTimeType} from 'run-time-assertions';
import {FullReviewRule} from '../../config/pull-request-vir-config';
import {
    GithubPullRequest,
    GithubRepo,
    GithubReview,
    GithubUser,
    Octokit,
    ReviewStatus,
} from '../../data/github';
import {SilentError} from '../../silent.error';
import {logJson} from '../../util/log-json';
import {SubActionParams} from '../sub-action-params';

type PullRequestReviews = {[username in string]: boolean};

export async function requireReviewers({config, octokit, pullRequest, repo}: SubActionParams) {
    if (!config.reviewRules.length) {
        log.success('No review rules, skipping review checks.');
        return;
    }

    const submittedReviews = (
        await octokit.rest.pulls.listReviews({
            ...repo,
            pull_number: pullRequest.number,
        })
    ).data as GithubReview[];

    const requestedReviewers = pullRequest.requested_reviewers || [];

    const reviews = parseReviews(requestedReviewers, submittedReviews);

    log.faint('current approvals');
    logJson(reviews, 'faint');

    const changedFiles = (
        await octokit.rest.pulls.listFiles({
            ...repo,
            pull_number: pullRequest.number,
        })
    ).data.map((file) => file.filename);

    log.faint('changed files:');
    logJson(changedFiles, 'faint');
    /** Wait for logging to finish? Cause GitHub Actions jumbles them all up. */
    await wait(100);

    const failedRules = (
        await awaitedBlockingMap(config.reviewRules, async (rule, index) => {
            const failure = await checkReviewRule(
                reviews,
                rule,
                octokit,
                pullRequest,
                repo,
                changedFiles,
            );
            if (!failure) {
                return undefined;
            }

            return {
                ...failure,
                ruleIndex: index,
                rule,
            };
        })
    ).filter(isTruthy);

    /** Wait for logging to finish? Cause GitHub Actions jumbles them all up. */
    await wait(100);

    if (failedRules.length) {
        log.error('Failed review rules.');
        logJson(failedRules, 'error');
        throw new SilentError();
    }

    log.success('All review rules have passed.');
}

export function parseReviews(
    requestedReviewers: ReadonlyArray<Readonly<GithubUser>>,
    submittedReviews: ReadonlyArray<Readonly<GithubReview>>,
): PullRequestReviews {
    const mostRecentReviewPerUser = submittedReviews.reduce(
        (accum, currentReview) => {
            const currentReviewDate = currentReview.submitted_at
                ? createUtcFullDate(currentReview.submitted_at)
                : undefined;
            const username = currentReview.user?.login;

            if (currentReview.state === ReviewStatus.Commented) {
                /**
                 * Completely ignore comment reviews as they mean nothing and include all comments,
                 * not just comment reviews.
                 */
                return accum;
            } else if (!username) {
                /** We can't reason about a review with no user name. */
                return accum;
            } else if (!currentReviewDate) {
                /** We can't compare reviews if the current one has not submission time. */
                return accum;
            }

            const latestReview = accum[username];
            const latestReviewDate = latestReview?.submitted_at
                ? createUtcFullDate(latestReview.submitted_at)
                : undefined;

            if (
                !latestReviewDate ||
                (currentReviewDate &&
                    isDateAfter({fullDate: currentReviewDate, relativeTo: latestReviewDate}))
            ) {
                accum[username] = currentReview;
            }

            return accum;
        },
        {} as Record<string, GithubReview>,
    );

    const approvals = mapObjectValues(mostRecentReviewPerUser, (username, review) => {
        return review.state === ReviewStatus.Approved;
    });

    requestedReviewers.forEach((requestedReviewer) => {
        approvals[requestedReviewer.login] = false;
    });

    return approvals;
}

async function checkReviewRule(
    reviews: Readonly<PullRequestReviews>,
    rule: Readonly<FullReviewRule>,
    octokit: Octokit,
    pullRequest: Readonly<Pick<GithubPullRequest, 'number' | 'user'>>,
    repo: Readonly<GithubRepo>,
    changedFiles: ReadonlyArray<string>,
): Promise<undefined | {failureReason: string}> {
    const author = pullRequest.user?.login || '';
    const matchesRequiredIf = rule.requiredIf.some((requiredIf) => {
        return changedFiles.some((filePath) => {
            if (isRunTimeType(requiredIf, 'string')) {
                return filePath.includes(requiredIf);
            } else {
                return filePath.match(requiredIf);
            }
        });
    });

    if (rule.requiredIf.length && !matchesRequiredIf) {
        /** Ignore this rule because its `requiredIf` field is not matched. */
        return undefined;
    }

    const reviewers = rule.users.reduce(
        (accum, user) => {
            if (user === author) {
                return accum;
            }

            if (user in reviews) {
                accum.allRequestedReviewers.push(user);

                if (reviews[user]) {
                    accum.approved.push(user);
                } else {
                    accum.unapproved.push(user);
                }
            } else {
                accum.notRequested.push(user);
            }

            return accum;
        },
        {
            /** These reviewers are missing entirely, a review was not requested from them. */
            notRequested: [] as string[],
            /** These reviewers have been added but have not approved. */
            unapproved: [] as string[],
            /** These reviewers have been added and have approved. */
            approved: [] as string[],
            /** These are all the reviewers that have already been added. */
            allRequestedReviewers: [] as string[],
        },
    );

    const requiredCount: number = rule.required === 'all' ? rule.users.length : rule.required;

    if (rule.autoAdd && reviewers.notRequested.length) {
        log.faint(`Adding reviewers: ${joinWithFinalConjunction(reviewers.notRequested, 'and')}`);
        const response = await octokit.rest.pulls.requestReviewers({
            ...repo,
            pull_number: pullRequest.number,
            reviewers: reviewers.notRequested,
        });
    }

    /** Takes into account manually added reviewers when `autoAdd` is turned off. */
    const actualRequiredCount = rule.autoAdd
        ? requiredCount
        : Math.min(reviewers.allRequestedReviewers.length, requiredCount);

    const missingApprovalCount = actualRequiredCount - reviewers.approved.length;

    if (missingApprovalCount > 0) {
        return {
            failureReason: `Missing ${missingApprovalCount} approvals from: ${joinWithFinalConjunction(reviewers.unapproved, 'or')}`,
        };
    }

    return undefined;
}
