import {log, runShellCommand} from '@augment-vir/node-js';
import {SimpleGit} from 'simple-git';
import {listGitDiff} from '../../util/git-diff';

export async function applyFormatting(git: SimpleGit, command: string, cwd: string) {
    log.info('Applying format...');
    const initialChanges = await listGitDiff(git);

    if (initialChanges.length) {
        log.error(initialChanges);
        throw new Error('Cannot apply format when there are already changes in the git index.');
    }

    await runShellCommand(command, {cwd, rejectOnError: true, hookUpToConsole: true});

    const formattedFiles = await listGitDiff(git);

    if (formattedFiles.length) {
        log.faint(`The following files were formatted:\n    ${formattedFiles.join('\n    ')}`);
        log.faint('Committing and pushing format...');
        await git.add(formattedFiles);
        await git.commit('apply formatting', formattedFiles);

        await git.push();
    } else {
        log.faint('No files were formatted.');
    }
}
