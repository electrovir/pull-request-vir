import {type SimpleGit} from 'simple-git';
import {type PullRequestVirConfig} from '../config/config.js';
import {GithubPullRequest, GithubRepo, Octokit} from '../data/github.js';
import type {CodeOwners} from './code-owners.js';

export type SubActionParams = Readonly<{
    config: Readonly<PullRequestVirConfig>;
    octokit: Readonly<Octokit>;
    git: Readonly<SimpleGit>;
    pullRequest: Readonly<GithubPullRequest>;
    repo: Readonly<GithubRepo>;
    repoDir: string;
    reviews: Readonly<PullRequestReviews>;
    codeOwners: Readonly<CodeOwners>;
    changedFilePaths: ReadonlyArray<string>;
}>;

export type PullRequestReviews = {[username in string]: boolean};
