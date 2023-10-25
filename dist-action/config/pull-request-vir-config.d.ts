/** Shape definition for verifying a config's validity. */
export declare const pullRequestVirConfigShape: import("object-shape-tester").ShapeDefinition<{
    applyFormatting: import("object-shape-tester").ShapeOr<[undefined, {
        command: string;
    }]>;
}, false>;
/** Config type expected by pull-request-vir. */
export type PullRequestVirConfig = Partial<typeof pullRequestVirConfigShape.runTimeType>;
/** Default value for config type expected by pull-request-vir. */
export declare const defaultPullRequestVirConfig: Readonly<{
    applyFormatting: {
        command: string;
    } | undefined;
}>;
