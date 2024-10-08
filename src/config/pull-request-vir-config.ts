import {and, classShape, defineShape, exact, indexedKeys, or} from 'object-shape-tester';

/**
 * The sanitized shape for an individual rule without user overrides.
 *
 * @category Shape
 */
export const fullReviewRuleShapeWithoutOverrides = defineShape({
    /**
     * Whether the listed users should be automatically added to the pull request or not.
     *
     * If this is set to false, then the users' reviews will only be required if they have been
     * manually added to the pull request.
     */
    autoAdd: true,
    /**
     * A list of user names to consider as reviewers. No `@` or other prefix is necessary, just type
     * their username directly.
     *
     * @example Users: ['electrovir'],
     */
    users: [''],
    /**
     * How many of the listed users are required. Use `'all'` to require all of them or a number to
     * require that many of them.
     *
     * @default 'all'
     */
    required: or(exact('all'), 1),
    /**
     * Acts like CODEOWNERS: the rule will only be required if the pull request changed file paths
     * matching any of the given strings or regular expressions.
     */
    requiredIf: [or('', classShape(RegExp))],
});

/**
 * Base type for {@link FullReviewRule} that lacks `userOverrides`.
 *
 * @category Internal
 */
export type FullReviewRuleWithoutOverrides = typeof fullReviewRuleShapeWithoutOverrides.runtimeType;

/**
 * The full, sanitized shape for a review rule.
 *
 * @category Shape
 */
export const fullReviewRuleShape = defineShape(
    and(fullReviewRuleShapeWithoutOverrides, {
        userOverrides: indexedKeys({
            keys: '',
            values: fullReviewRuleShapeWithoutOverrides,
            required: false,
        }),
    }),
);

/**
 * A full, sanitized review rule.
 *
 * @category Internal
 */
export type FullReviewRule = typeof fullReviewRuleShape.runtimeType;

/**
 * Shape definition for verifying a config's validity.
 *
 * @category Shape
 */
export const pullRequestVirConfigShape = defineShape({
    /**
     * If the pull request has no assignees, assign the pull request to its author. Set this
     * property to `false` to disable that behavior.
     *
     * @default true
     */
    assignToAuthor: true,
    /**
     * If this PR's base branch is itself used as the base branch in another PR, wait until that PR
     * is merged. This is used for chained PRs or stacked diff PRs to ensure the root of each chain
     * is merged first.
     *
     * @default true
     */
    waitForParentPullRequest: true,
    /**
     * If the pull request has any "no merge" phrases (see below for a list of what those are) in
     * labels, commit messages, added lines, or the PR title, this GitHub Action will fail. If you
     * wish to disable this behavior, set this property to `false`.
     *
     * "no merge" phrases are case insensitive and include:
     *
     * - "no merge"
     * - "no-merge"
     * - "nomerge"
     * - "not merge"
     * - "not-merge"
     * - "notmerge"
     * - "block merge"
     * - "block-merge"
     * - "blockmerge"
     *
     * @default true
     */
    blockNoMerge: true,
    /**
     * Require a primary reviewer to be specified in the Pull Request body and require that reviewer
     * to give an approval. Primary reviewers are detected with the string "primary reviewer" and
     * `@` before each username.
     *
     * @default true
     */
    checkPrimaryReviewer: true,
    /**
     * Ignore all checks on draft PRs.
     *
     * @default true
     */
    ignoreDraft: true,
    /**
     * Reviewer configuration. All rules entry in the array is must match. Meaning, they're combined
     * with "and", &&, or intersection logic.
     */
    reviewRules: [fullReviewRuleShape],
});

/**
 * Full config used by pull-request-vir.
 *
 * @category Internal
 */
export type FullPullRequestVirConfig = typeof pullRequestVirConfigShape.runtimeType;
