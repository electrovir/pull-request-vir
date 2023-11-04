import { Octokit } from '@octokit/core';
export declare function triggerWorkflow(octokit: Octokit, workflowFileName: string): Promise<void>;
