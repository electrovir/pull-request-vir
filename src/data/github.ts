import type {getOctokit} from '@actions/github';
import type {ArrayElement, Overwrite} from '@augment-vir/common';
import {components} from '@octokit/openapi-types';

export type GithubActionsEventTriggerName = ArrayElement<
    NonNullable<
        /**
         * These types aren't individually exported anywhere so we have to extract them from this
         * location.
         */
        components['schemas']['webhook-check-suite-completed']['check_suite']['app']['events']
    >
>;

export type GithubPullRequest = components['schemas']['pull-request-simple'];

export type GithubUser = components['schemas']['simple-user'];
export type GithubReview = Overwrite<
    components['schemas']['pull-request-review'],
    {
        state: ReviewStatus;
    }
>;

export enum ReviewStatus {
    ChangesRequested = 'CHANGES_REQUESTED',
    Approved = 'APPROVED',
    Commented = 'COMMENTED',
    Dismissed = 'DISMISSED',
}

export type Octokit = ReturnType<typeof getOctokit>;

export type GithubRepo = {
    owner: string;
    repo: string;
};
