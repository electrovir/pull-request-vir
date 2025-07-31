import {context as githubContext} from '@actions/github';
import {type GithubPullRequest, type Octokit} from '../data/github.js';

export async function fetchGithubPullRequest(
    octokit: Readonly<Octokit>,
    branchName: string,
): Promise<GithubPullRequest | undefined> {
    return (
        await octokit.rest.pulls.list({
            ...githubContext.repo,
            head: [
                githubContext.repo.owner,
                branchName,
            ].join(':'),
            state: 'open',
            sort: 'updated',
            direction: 'desc',
        })
    ).data[0];
}
