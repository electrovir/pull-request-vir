import {getInput} from '@actions/core';
import {getOctokit, context as githubContext} from '@actions/github';
import {log} from '@augment-vir/node-js';
import {existsSync} from 'fs';
import {GithubRepo, Octokit} from '../data/github';

export function extractEnvVars(): {
    repoDir: string;
    repo: GithubRepo;
    octokit: Octokit;
    branchName: string;
    currentRunId: number;
    workflowName: string;
} {
    const repoDir = process.env.GITHUB_WORKSPACE;
    if (!repoDir || !existsSync(repoDir)) {
        throw new Error(`Invalid repo dir: ${repoDir}`);
    }
    log.faint(`repo dir: ${repoDir}`);
    const repo = githubContext.repo;
    const token = getInput('token', {trimWhitespace: true});
    if (!token) {
        throw new Error('Missing token GitHub Action input.');
    }
    const octokit = getOctokit(token);
    const branchName = githubContext.payload.pull_request?.head?.ref as string;
    log.faint(`branch name: ${branchName}`);
    if (!branchName) {
        throw new Error('Unable to find branch name.');
    }
    const currentRunId = githubContext.runId;
    log.faint(`run id: ${currentRunId}`);
    const workflowName = githubContext.workflow;
    log.faint(`workflow name: ${workflowName}`);

    return {
        repoDir,
        repo,
        octokit,
        branchName,
        currentRunId,
        workflowName,
    };
}
