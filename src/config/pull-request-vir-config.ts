import {defineShape, or} from 'object-shape-tester';

/** Shape definition for verifying a config's validity. */
export const pullRequestVirConfigShape = defineShape({
    applyFormatting: or(undefined, {
        command: '',
    }),
});

/** Config type expected by pull-request-vir. */
export type PullRequestVirConfig = Partial<typeof pullRequestVirConfigShape.runTimeType>;
/** Default value for config type expected by pull-request-vir. */
export const defaultPullRequestVirConfig = pullRequestVirConfigShape.defaultValue;
