import {MaybePromise, Overwrite, PartialWithUndefined} from '@augment-vir/common';
import {SetOptional} from 'type-fest';
import {FullPullRequestVirConfig, FullReviewRule} from './pull-request-vir-config.js';

/**
 * `FullReviewRule` with more lax properties and without overrides.
 *
 * @category Internal
 */
export type ReviewRuleWithoutOverrides = SetOptional<FullReviewRule, 'requiredIf' | 'required'>;

/**
 * `FullReviewRule` with more lax properties, used for defining a config.
 *
 * @category Main
 */
export type ReviewRule = Overwrite<
    ReviewRuleWithoutOverrides,
    PartialWithUndefined<{
        userOverrides: Record<string, Partial<ReviewRuleWithoutOverrides>>;
    }>
>;

/**
 * Expected config for pull-request-vir GitHub Action.
 *
 * @category Internal
 */
export type PullRequestVirConfig = PartialWithUndefined<
    Overwrite<FullPullRequestVirConfig, {reviewRules: ReviewRule[]}>
>;
/**
 * Config for pull-request-vir.
 *
 * @category Main
 * @example
 *
 * ```ts
 * import type {Config} from 'pull-request-vir';
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
