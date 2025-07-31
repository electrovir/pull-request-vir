import {type getOctokit} from '@actions/github';
import {type components} from '@octokit/openapi-types';
import {defineShape, enumShape, or} from 'object-shape-tester';

/**
 * A pull request
 *
 * @category Shape
 */
export type GithubPullRequest = components['schemas']['pull-request-simple'];

/**
 * An individual GitHub user.
 *
 * @category Shape
 */
export type GithubUser = components['schemas']['simple-user'];

/**
 * An instance of GitHub's Octokit API. Can be used to send requests to GitHub.
 *
 * @category Shape
 */
export type Octokit = ReturnType<typeof getOctokit>;

/**
 * A GitHub repo's name and owner.
 *
 * @category Shape
 */
export type GithubRepo = {
    owner: string;
    /** The repo name. */
    repo: string;
};

/**
 * All the possible review statuses that a pull request review can have in an enum form.
 *
 * @category Shape
 */
export enum GithubGraphqlReviewState {
    Approved = 'APPROVED',
    Pending = 'PENDING',
    Commented = 'COMMENTED',
    ChangesRequested = 'CHANGES_REQUESTED',
    Dismissed = 'DISMISSED',
}

/**
 * Shape definition for an individual user's search result.
 *
 * @category Shape
 */
export const githubUserSearchResponseShape = defineShape(
    {
        login: '',
        avatarUrl: or(undefined, ''),
        teamAvatarUrl: or(undefined, ''),
        url: '',
    },
    true,
);

/**
 * Shape definition for an individual pull request review.
 *
 * @category Shape
 */
export const githubReviewShape = defineShape(
    {
        state: enumShape(GithubGraphqlReviewState),
        author: githubUserSearchResponseShape,
        submittedAt: '',
    },
    true,
);

/**
 * A review posted to a GitHub pull request.
 *
 * @category Shape
 */
export type GithubReview = typeof githubReviewShape.runtimeType;
