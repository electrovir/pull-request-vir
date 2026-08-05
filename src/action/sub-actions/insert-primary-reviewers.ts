import {removeDuplicates} from '@augment-vir/common';
import {
    determineReviewRuleContext,
    isRuleActive,
    resolveRule,
    type ReviewRuleContextParams,
} from '../review-rules.js';

export const primaryReviewersComments = {
    start: '<!-- primary reviewers start -->',
    end: '<!-- primary reviewers end -->',
};

const primaryReviewersCommentsRegExp = new RegExp(
    String.raw`${primaryReviewersComments.start}[\S\s]*?${primaryReviewersComments.end}\n*`,
);

/**
 * Any mention of a primary reviewer, matching what
 * [review-vir](https://github.com/electrovir/review-vir) and `checkPrimaryReviewers` detect.
 */
const primaryReviewerTriggerRegExp = /primary reviewers?/i;

/** The users that all applicable `isPrimary` review rules mark as primary reviewers. */
export function determinePrimaryReviewers(params: ReviewRuleContextParams): string[] {
    const context = determineReviewRuleContext(params);

    return removeDuplicates(
        (params.config.reviewRules || [])
            .filter((rawRule) => rawRule.isPrimary && isRuleActive(rawRule, context))
            .flatMap((rawRule) => resolveRule(rawRule, context.author).users || [])
            .filter((username) => username !== context.author),
    );
}

/**
 * The new pull request body with the primary reviewers block inserted, or `undefined` if the body
 * needs no changes.
 */
export function determineBodyWithPrimaryReviewers({
    body,
    primaryReviewers,
}: Readonly<{
    body: string;
    primaryReviewers: ReadonlyArray<string>;
}>): string | undefined {
    const bodyWithoutBlock = body.replace(primaryReviewersCommentsRegExp, '');

    /**
     * A primary reviewer that this action didn't insert was chosen by a human: leave it, and this
     * action's block, alone.
     */
    if (primaryReviewerTriggerRegExp.test(bodyWithoutBlock)) {
        return undefined;
    } else if (!primaryReviewers.length) {
        return bodyWithoutBlock === body ? undefined : bodyWithoutBlock;
    }

    /** The blank line after the usernames terminates the list for review-vir's description parser. */
    const newBody = [
        [
            primaryReviewersComments.start,
            [
                '**Primary ',
                primaryReviewers.length > 1 ? 'reviewers' : 'reviewer',
                '**: ',
                primaryReviewers.map((username) => `@${username}`).join(', '),
            ].join(''),
            '',
            primaryReviewersComments.end,
        ].join('\n'),
        bodyWithoutBlock,
    ].join('\n\n');

    return newBody === body ? undefined : newBody;
}
