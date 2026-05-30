import {getInput} from '@actions/core';
import {getOctokit, context as githubContext} from '@actions/github';
import {log} from '@augment-vir/common';
import {existsSync} from 'node:fs';
import {basename} from 'node:path';
import {type GithubRepo, type Octokit} from '../data/github.js';

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
    const token = getInput('token', {
        trimWhitespace: true,
    });
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
    const workflowName = basename(process.env.GITHUB_WORKFLOW_REF?.replace(/@ref.+$/, '') || '');
    log.faint(`workflow name: ${workflowName}`);
    if (!workflowName) {
        throw new Error(`Missing workflow name: '${workflowName}'`);
    }

    return {
        repoDir,
        repo,
        octokit,
        branchName,
        currentRunId,
        workflowName,
    };
}
