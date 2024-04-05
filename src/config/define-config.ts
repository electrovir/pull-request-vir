import {MaybePromise, Overwrite, PartialAndUndefined} from '@augment-vir/common';
import {SetOptional} from 'type-fest';
import {FullPullRequestVirConfig, FullReviewRule} from './pull-request-vir-config';

/** `FullReviewRule` with more lax properties, used for defining a config. */
export type ReviewRule = SetOptional<FullReviewRule, 'requiredIf' | 'required'>;

/** Expected config for pull-request-vir GitHub Action. */
export type PullRequestVirConfig = PartialAndUndefined<
    Overwrite<FullPullRequestVirConfig, {reviewRules: ReviewRule[]}>
>;
/** All possible `definePullRequestVirConfig` inputs. */
export type ConfigInput =
    | MaybePromise<PullRequestVirConfig>
    | (() => MaybePromise<PullRequestVirConfig>);

/**
 * Define a config for pull-request-vir.
 *
 * @example
 *     export default definePullRequestVirConfig({
 *         reviewRules: [
 *             {
 *                 autoAdd: true,
 *                 users: ['electrovir'],
 *             },
 *         ],
 *     });
 *
 * @param config Can either be a config object, a promise of a config object, or a callback that
 *   returns either of those.
 */
export function definePullRequestVirConfig(config: ConfigInput = {}) {
    if (typeof config === 'function') {
        return config();
    } else {
        return config;
    }
}
