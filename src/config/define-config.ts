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
export type Config =
    | MaybePromise<PullRequestVirConfig>
    | (() => MaybePromise<PullRequestVirConfig>);
