import {log, type SelectFrom} from '@augment-vir/common';
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
    requireFreshReviews,
}: {
    pullRequest: Readonly<GithubPullRequest>;
    octokit: Readonly<Octokit>;
    repo: Readonly<GithubRepo>;
    requireFreshReviews: boolean;
}) {
    const {reviews: submittedReviews, latestCommitDate} = await fetchSubmittedReviews({
        octokit,
        pullRequest,
        repo,
    });

    const requestedReviewers = pullRequest.requested_reviewers || [];

    return parseReviews(
        requestedReviewers,
        submittedReviews,
        requireFreshReviews ? latestCommitDate : undefined,
    );
}

export function parseReviews(
    requestedReviewers: ReadonlyArray<Readonly<GithubUser>>,
    submittedReviews: ReadonlyArray<Readonly<GithubReview>>,
    latestCommitDate?: string,
): PullRequestReviews {
    const approvals = submittedReviews.reduce((accum, review) => {
        const isApproved = review.state === GithubGraphqlReviewState.Approved;

        if (isApproved && latestCommitDate && review.submittedAt < latestCommitDate) {
            log.faint(
                `Stale approval from '${review.author.login}': reviewed at ${review.submittedAt}, latest commit at ${latestCommitDate}`,
            );
            accum[review.author.login] = false;
        } else {
            accum[review.author.login] = isApproved;
        }

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
>): Promise<{reviews: GithubReview[]; latestCommitDate: string}> {
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
                        commits(last: 1) {
                            nodes {
                                commit {
                                    committedDate
                                }
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

    return {
        reviews: results.repository.pullRequest.latestOpinionatedReviews.nodes,
        latestCommitDate: results.repository.pullRequest.commits.nodes[0]?.commit.committedDate,
    };
}
