import {getInput, setFailed} from '@actions/core';
import {extractErrorMessage} from '@augment-vir/common';
import {log} from '@augment-vir/node-js';
import {Octokit} from '@octokit/core';
import {setupGit} from '../util/setup-git';
import {loadConfig} from './load-config';
import {applyFormatting} from './sub-actions/apply-formatting';
import {triggerWorkflow} from './sub-actions/trigger-workflow';

export async function runAction() {
    try {
        const config = await loadConfig();

        const git = await setupGit();
        const cwd = process.cwd();
        const octokit = new Octokit({
            auth: getInput('token'),
        });

        if (config.applyFormatting?.command) {
            await applyFormatting(git, config.applyFormatting.command, cwd);
        }

        /** This sub action should always go last. */
        if (config.triggerWorkflow?.fileName) {
            await triggerWorkflow(octokit, config.triggerWorkflow.fileName);
        }
    } catch (error) {
        log.error(error);
        setFailed(extractErrorMessage(error));
    }
}
