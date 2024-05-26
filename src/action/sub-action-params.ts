import {FullPullRequestVirConfig} from '../config/pull-request-vir-config';
import {GithubPullRequest, GithubRepo, Octokit} from '../data/github';

export type SubActionParams = Readonly<{
    config: Readonly<FullPullRequestVirConfig>;
    octokit: Readonly<Octokit>;
    pullRequest: Readonly<GithubPullRequest>;
    repo: Readonly<GithubRepo>;
    repoDir: string;
    reviews: Readonly<PullRequestReviews>;
}>;

export type PullRequestReviews = {[username in string]: boolean};
