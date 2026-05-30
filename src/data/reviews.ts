import {type SelectFrom} from '@augment-vir/common';
import {type PullRequestReviews, type ScriptParams} from '../config/config.js';
import {
    GithubGraphqlReviewState,
    type GithubPullRequest,
    type GithubRepo,
    type GithubReview,
    type GithubUser,
    type Octokit,
} from './github.js';

export async function getCompleteReviewStatus({
    pullRequest,
    octokit,
    repo,
}: {
    pullRequest: Readonly<GithubPullRequest>;
    octokit: Readonly<Octokit>;
    repo: Readonly<GithubRepo>;
}) {
    const submittedReviews = await fetchSubmittedReviews({
        octokit,
        pullRequest,
        repo,
    });

    const requestedReviewers = pullRequest.requested_reviewers || [];

    return parseReviews(requestedReviewers, submittedReviews);
}

function parseReviews(
    requestedReviewers: ReadonlyArray<Readonly<GithubUser>>,
    submittedReviews: ReadonlyArray<Readonly<GithubReview>>,
): PullRequestReviews {
    const approvals = submittedReviews.reduce((accum, review) => {
        accum[review.author.login] = review.state === GithubGraphqlReviewState.Approved;
        return accum;
    }, {} as PullRequestReviews);

    requestedReviewers.forEach((requestedReviewer) => {
        approvals[requestedReviewer.login] = false;
    });

    return approvals;
}

async function fetchSubmittedReviews({
    octokit,
    repo,
    pullRequest,
}: SelectFrom<
    ScriptParams,
    {
        octokit: {
            graphql: true;
        };
        repo: {
            owner: true;
            repo: true;
        };
        pullRequest: {
            number: true;
        };
    }
>): Promise<GithubReview[]> {
    const results: any = await octokit.graphql(
        /* GraphQL */ `
            query ($owner: String!, $repo: String!, $pullNumber: Int!) {
                repository(owner: $owner, name: $repo) {
                    pullRequest(number: $pullNumber) {
                        latestOpinionatedReviews(first: 10) {
                            nodes {
                                author {
                                    login
                                    avatarUrl
                                    url
                                }
                                submittedAt
                                state
                            }
                        }
                    }
                }
            }
        `,
        {
            owner: repo.owner,
            repo: repo.repo,
            pullNumber: pullRequest.number,
        },
    );

    return results.repository.pullRequest.latestOpinionatedReviews.nodes;
}
