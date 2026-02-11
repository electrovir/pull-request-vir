import {type AnyFunction, type MaybePromise, type TypedFunction} from '@augment-vir/common';
import {
    classShape,
    defineShape,
    exactShape,
    intersectShape,
    optionalShape,
    recordShape,
    unionShape,
} from 'object-shape-tester';
import {type SimpleGit} from 'simple-git';
import {type GithubPullRequest, type GithubRepo, type Octokit} from '../data/github.js';

/**
 * A collection of code owners for an individual pull request.
 *
 * @category Shape
 */
export type CodeOwners = {
    [Username in string]: string[] /** A list of matched code owned paths. */;
};

/**
 * Params for each script executed internally and defined externally in the user's config.
 *
 * @category Shape
 */
export type ScriptParams = Readonly<{
    config: Readonly<PullRequestVirConfig>;
    octokit: Readonly<Octokit>;
    git: Readonly<SimpleGit>;
    pullRequest: Readonly<GithubPullRequest>;
    repo: Readonly<GithubRepo>;
    repoDir: string;
    reviews: Readonly<PullRequestReviews>;
    codeOwners: Readonly<CodeOwners>;
    changedFilePaths: ReadonlyArray<string>;
}>;

/**
 * A collection of pull request reviews.
 *
 * @category Shape
 */
export type PullRequestReviews = {
    [username in string]: boolean /** Whether the user has approved the pull request or not. */;
};

/**
 * The sanitized shape for an individual rule without user overrides.
 *
 * @category Shape
 */
export const reviewRuleWithoutOverridesShape = defineShape({
    /**
     * Whether the listed users should be automatically added to the pull request or not.
     *
     * If this is set to false, then the users' reviews will only be required if they have been
     * manually added to the pull request.
     */
    autoAdd: optionalShape(true),
    /**
     * A list of user names to consider as reviewers. No `@` or other prefix is necessary, just type
     * their username directly.
     *
     * @example Users: ['electrovir'],
     */
    users: optionalShape(['']),
    /**
     * How many of the listed users are required. Use `'all'` to require all of them or a number to
     * require that many of them.
     *
     * @default 'all'
     */
    required: optionalShape(unionShape(exactShape('all'), 1)),
    /**
     * The rule will only be required if the pull request changed file paths matching any of the
     * given strings or regular expressions, ignoring the `notPaths` strings or regular
     * expressions.
     */
    codeOwns: optionalShape(
        {
            paths: optionalShape([unionShape('', classShape(RegExp))]),
            notPaths: optionalShape([unionShape('', classShape(RegExp))]),
        },
        {
            alsoUndefined: true,
        },
    ),
});

/**
 * Base type for {@link ReviewRule} that lacks `userOverrides`.
 *
 * @category Internal
 */
export type ReviewRuleWithoutOverrides = typeof reviewRuleWithoutOverridesShape.runtimeType;

/**
 * The full, sanitized shape for a review rule.
 *
 * @category Shape
 */
export const reviewRuleShape = defineShape(
    intersectShape(reviewRuleWithoutOverridesShape, {
        userOverrides: optionalShape(
            recordShape({
                keys: '',
                values: reviewRuleWithoutOverridesShape,
            }),
            {
                alsoUndefined: true,
            },
        ),
    }),
);

/**
 * A full, sanitized review rule.
 *
 * @category Internal
 */
export type ReviewRule = typeof reviewRuleShape.runtimeType;

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
    assignToAuthor: optionalShape(true),
    /**
     * If this PR's base branch is itself used as the base branch in another PR, wait until that PR
     * is merged. This is used for chained PRs or stacked diff PRs to ensure the root of each chain
     * is merged first.
     *
     * @default true
     */
    waitForParentPullRequest: optionalShape(true),
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
    blockNoMerge: optionalShape(true),
    /**
     * Require a primary reviewer to be specified in the Pull Request body and require that reviewer
     * to give an approval. Primary reviewers are detected with the string "primary reviewer" and
     * `@` before each username.
     *
     * @default true
     */
    checkPrimaryReviewer: optionalShape(true),
    /**
     * Ignore all checks on draft PRs.
     *
     * @default true
     */
    ignoreDraft: optionalShape(true),
    /**
     * Reviewer configuration. All rules entry in the array is must match. Meaning, they're combined
     * with "and", &&, or intersection logic.
     */
    reviewRules: optionalShape([reviewRuleShape]),
    /**
     * Treat approvals as invalid if they were submitted before the latest commit on the pull
     * request. This helps ensure reviewers have seen the latest code changes.
     *
     * Note: this will also invalidate reviews after a rebase, even if the code hasn't changed.
     *
     * @default false
     */
    requireFreshReviews: optionalShape(false),
    /**
     * Inserts the usernames of code owners into a pull request's description.
     *
     * @default true
     */
    insertCodeOwners: optionalShape(true),
    /** Arbitrary scripts that will be executed in order on a pull request. */
    scripts: optionalShape([
        (() => {}) as AnyFunction as TypedFunction<ScriptParams,
            Promise<void>>,
    ]),
});

/**
 * Full config used by pull-request-vir.
 *
 * @category Internal
 */
export type PullRequestVirConfig = typeof pullRequestVirConfigShape.runtimeType;

/**
 * Config for pull-request-vir.
 *
 * @category Main
 * @example
 *
 * ```ts
 * import {type Config} from 'pull-request-vir';
 *
 * export const config: Config = {
 *     assignToAuthor: true,
 *     blockNoMerge: true,
 *     reviewRules: [
 *         {
 *             autoAdd: true,
 *             users: [
 *                 'electrovir',
 *                 'another-user',
 *                 'ghost',
 *             ],
 *             required: 2,
 *             requiredIf: [/^src\/backend\//],
 *         },
 *     ],
 * };
 * ```
 */
export type Config =
    | MaybePromise<PullRequestVirConfig>
    | (() => MaybePromise<PullRequestVirConfig>);
