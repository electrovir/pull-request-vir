import {PickDeep} from '@augment-vir/common';
import {PullRequestReviews, SubActionParams} from '../action/sub-action-params';
import {
    GithubGraphqlReviewState,
    GithubPullRequest,
    GithubRepo,
    GithubReview,
    GithubUser,
    Octokit,
} from './github';

export async function getCompleteReviewStatus({
    pullRequest,
    octokit,
    repo,
}: {
    pullRequest: Readonly<GithubPullRequest>;
    octokit: Readonly<Octokit>;
    repo: Readonly<GithubRepo>;
}) {
    const submittedReviews = await fetchSubmittedReviews({octokit, pullRequest, repo});

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
}: PickDeep<
    SubActionParams,
    ['octokit' | 'repo' | 'pullRequest', 'graphql' | 'owner' | 'repo' | 'number']
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
