import {setFailed} from '@actions/core';
import {extractErrorMessage} from '@augment-vir/common';
import {log} from '@augment-vir/node-js';
import {setupGit} from '../util/setup-git';
import {loadConfig} from './load-config';
import {applyFormatting} from './sub-actions/apply-formatting';

export async function runAction() {
    try {
        const config = await loadConfig();
        log.faint('received config:');
        log.faint(JSON.stringify(config, null, 4));

        const git = await setupGit();
        const cwd = process.cwd();

        if (config.applyFormatting?.command) {
            await applyFormatting(git, config.applyFormatting.command, cwd);
        }
    } catch (error) {
        log.error(error);
        setFailed(extractErrorMessage(error));
    }
}

if (require.main === module) {
    runAction();
}
