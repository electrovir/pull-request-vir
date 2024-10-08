import type {getOctokit} from '@actions/github';
import type {ArrayElement} from '@augment-vir/common';
import type {components} from '@octokit/openapi-types';
import {defineShape, enumShape, or} from 'object-shape-tester';

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

export enum GithubGraphqlReviewState {
    Approved = 'APPROVED',
    Pending = 'PENDING',
    Commented = 'COMMENTED',
    ChangesRequested = 'CHANGES_REQUESTED',
    Dismissed = 'DISMISSED',
}

const githubUserSearchResponseShape = defineShape(
    {
        login: '',
        avatarUrl: or(undefined, ''),
        teamAvatarUrl: or(undefined, ''),
        url: '',
    },
    true,
);

export const githubReviewShape = defineShape(
    {
        state: enumShape(GithubGraphqlReviewState),
        author: githubUserSearchResponseShape,
        submittedAt: '',
    },
    true,
);
export type GithubReview = typeof githubReviewShape.runtimeType;
