import {check} from '@augment-vir/assert';
import {
    awaitedBlockingMap,
    joinWithFinalConjunction,
    log,
    wait,
    type SelectFrom,
} from '@augment-vir/common';
import {type PullRequestReviews, type ReviewRule, type ScriptParams} from '../../config/config.js';
import {type GithubPullRequest, type GithubRepo, type Octokit} from '../../data/github.js';
import {SilentError} from '../../silent.error.js';
import {logJson} from '../../util/log-json.js';

export async function requireReviewers({
    config,
    octokit,
    pullRequest,
    repo,
    reviews,
    codeOwners,
}: Readonly<
    SelectFrom<
        ScriptParams,
        {
            config: {
                reviewRules: true;
            };
            octokit: {
                rest: {
                    pulls: {
                        listFiles: true;
                        requestReviewers: true;
                    };
                };
            };
            repo: true;
            reviews: true;
            pullRequest: {
                number: true;
                user: {
                    login: true;
                };
            };
            codeOwners: true;
        }
    >
>): Promise<void> {
    if (!config.reviewRules?.length) {
        log.success('No review rules, skipping review checks.');
        return;
    }

    /** Wait for logging to finish? Cause GitHub Actions jumbles them all up. */
    await wait({
        milliseconds: 100,
    });

    const failedRules = (
        await awaitedBlockingMap(config.reviewRules, async (rule, index) => {
            const failure = await checkReviewRule({
                reviews,
                rawRule: rule,
                octokit,
                pullRequest,
                repo,
                codeOwners: Object.keys(codeOwners),
                ruleIndex: index,
            });
            if (!failure) {
                return undefined;
            }

            return {
                ...failure,
                ruleIndex: index,
                rule,
            };
        })
    ).filter(check.isTruthy);

    /** Wait for logging to finish? Cause GitHub Actions jumbles them all up. */
    await wait({
        milliseconds: 100,
    });

    if (failedRules.length) {
        log.error('Failed review rules.');
        logJson(failedRules, 'error');
        throw new SilentError();
    }

    log.success('All review rules have passed.');
}

async function checkReviewRule({
    reviews,
    rawRule,
    octokit,
    pullRequest,
    repo,
    codeOwners,
    ruleIndex,
}: {
    reviews: Readonly<PullRequestReviews>;
    rawRule: Readonly<ReviewRule>;
    octokit: Readonly<
        SelectFrom<
            Octokit,
            {
                rest: {
                    pulls: {
                        requestReviewers: true;
                    };
                };
            }
        >
    >;
    pullRequest: Readonly<
        SelectFrom<
            GithubPullRequest,
            {
                number: true;
                user: {
                    login: true;
                };
            }
        >
    >;
    repo: Readonly<GithubRepo>;
    codeOwners: ReadonlyArray<string>;
    ruleIndex: number;
}): Promise<undefined | {failureReason: string}> {
    const author = pullRequest.user?.login || '';
    const ruleOverride = author ? rawRule.userOverrides?.[author] : undefined;
    const rule = ruleOverride ?? rawRule;

    if (!rule.users || !check.isLengthAtLeast(rule.users, 1)) {
        log.warning(`No users for rule at index '${ruleIndex}'`);
        return undefined;
    } else if (rule.users.length === 1 && author && rule.users[0] === author) {
        log.faint('Ignoring rule because the author is the only rule user.');
        logJson(rule, 'faint');
        return undefined;
    } else if (
        rule.codeOwns?.paths?.length &&
        !rule.users.some((username) => codeOwners.includes(username))
    ) {
        /** Ignore this rule because its `codeOwns` field is not matched. */
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

    const requiredCount: number =
        rule.required == undefined || rule.required === 'all' ? rule.users.length : rule.required;

    if (rule.autoAdd && reviewers.notRequested.length) {
        log.faint(`Adding reviewers: ${joinWithFinalConjunction(reviewers.notRequested, 'and')}`);
        await octokit.rest.pulls.requestReviewers({
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
