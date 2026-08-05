import {check} from '@augment-vir/assert';
import {type SelectFrom} from '@augment-vir/common';
import {type PullRequestReviews, type ReviewRule, type ScriptParams} from '../config/config.js';

/**
 * Pull request details that every review rule is evaluated against.
 *
 * @category Internal
 */
export type ReviewRuleContext = Readonly<{
    author: string;
    assignees: ReadonlyArray<string>;
    codeOwners: ReadonlyArray<string>;
    /** Whether any non-fallback rule adds reviewers to the pull request. */
    nonFallbackRulesAddReviewers: boolean;
}>;

export type ReviewRuleContextParams = Readonly<
    SelectFrom<
        ScriptParams,
        {
            config: {
                assignToAuthor: true;
                reviewRules: true;
            };
            pullRequest: {
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
>;

export function determineReviewRuleContext({
    config,
    pullRequest,
    reviews,
    codeOwners,
}: ReviewRuleContextParams): ReviewRuleContext {
    const author = pullRequest.user?.login || '';
    /**
     * `autoAssignAuthor` assigns the author to a pull request that has no assignees, but that
     * happens through the API and isn't reflected in this already-fetched pull request. Mirror its
     * outcome here so `appliesTo` rules match on the same run.
     */
    const assignees = pullRequest.assignees?.length
        ? pullRequest.assignees.map((assignee) => assignee.login)
        : config.assignToAuthor && author
          ? [author]
          : [];
    const codeOwnerUsernames = Object.keys(codeOwners);

    return {
        author,
        assignees,
        codeOwners: codeOwnerUsernames,
        nonFallbackRulesAddReviewers: (config.reviewRules || []).some((rawRule) => {
            return (
                !rawRule.isFallback &&
                doesRuleAddReviewers({
                    rawRule,
                    author,
                    assignees,
                    reviews,
                    codeOwners: codeOwnerUsernames,
                })
            );
        }),
    };
}

export function resolveRule(rawRule: Readonly<ReviewRule>, author: string): Readonly<ReviewRule> {
    const ruleOverride = author ? rawRule.userOverrides?.[author] : undefined;
    return ruleOverride ?? rawRule;
}

/**
 * Whether any of the pull request's assignees satisfies the rule's `appliesTo` restriction. A rule
 * without `appliesTo` applies to every pull request.
 */
export function isAppliesToMatched(
    rule: Readonly<ReviewRule>,
    assignees: ReadonlyArray<string>,
): boolean {
    if (!rule.appliesTo?.length) {
        return true;
    }

    return rule.appliesTo.some((username) => assignees.includes(username));
}

export function isCodeOwnsMatched(
    rule: Readonly<ReviewRule>,
    codeOwners: ReadonlyArray<string>,
): boolean {
    if (!rule.codeOwns?.paths?.length) {
        return true;
    }

    return !!rule.users?.some((username) => codeOwners.includes(username));
}

/**
 * A fallback rule only applies when it is not already satisfied by code ownership and no other rule
 * added reviewers to the pull request.
 */
export function isFallbackActive(rule: Readonly<ReviewRule>, context: ReviewRuleContext): boolean {
    return !!rule.isFallback && !context.nonFallbackRulesAddReviewers;
}

/** Whether a rule's reviewers are required on the given pull request. */
export function isRuleActive(rawRule: Readonly<ReviewRule>, context: ReviewRuleContext): boolean {
    const rule = resolveRule(rawRule, context.author);

    if (
        !rule.users ||
        !check.isLengthAtLeast(rule.users, 1) ||
        !isAppliesToMatched(rule, context.assignees) ||
        /** A rule whose only user is the pull request's author cannot be satisfied. */
        (rule.users.length === 1 && context.author && rule.users[0] === context.author)
    ) {
        return false;
    }

    return isCodeOwnsMatched(rule, context.codeOwners) || isFallbackActive(rule, context);
}

/**
 * Determines whether a rule contributes reviewers to the pull request: it is matched by code
 * ownership and either auto-adds its users or already has requested reviewers among its users.
 */
export function doesRuleAddReviewers({
    rawRule,
    author,
    assignees,
    reviews,
    codeOwners,
}: {
    rawRule: Readonly<ReviewRule>;
    author: string;
    assignees: ReadonlyArray<string>;
    reviews: Readonly<PullRequestReviews>;
    codeOwners: ReadonlyArray<string>;
}): boolean {
    const rule = resolveRule(rawRule, author);

    if (
        !rule.users ||
        !check.isLengthAtLeast(rule.users, 1) ||
        !isAppliesToMatched(rule, assignees) ||
        !isCodeOwnsMatched(rule, codeOwners)
    ) {
        return false;
    }

    const relevantUsers = rule.users.filter((user) => user !== author);

    if (!relevantUsers.length) {
        return false;
    } else if (rule.autoAdd) {
        return true;
    } else {
        return relevantUsers.some((user) => user in reviews);
    }
}
