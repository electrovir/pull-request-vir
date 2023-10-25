import {isTruthy} from '@augment-vir/common';
import {SimpleGit} from 'simple-git';

export async function listGitDiff(simpleGit: SimpleGit): Promise<string[]> {
    const output = await simpleGit.raw([
        'diff-index',
        '--name-only',
        'HEAD',
    ]);

    return output
        .split('\n')
        .map((line) => line.trim())
        .filter(isTruthy);
}
