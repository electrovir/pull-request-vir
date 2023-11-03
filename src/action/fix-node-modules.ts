import {readdir, symlink} from 'fs/promises';
import {join, resolve} from 'path';

async function findNodeModulesPath() {
    const thisActionPath = join('electrovir', 'pull-request-vir');

    const githubRunnerWorkPath = process.cwd().split(thisActionPath)[0];

    if (!githubRunnerWorkPath) {
        throw new Error(`Failed to find work directory.`);
    }

    const workContents = await readdir(githubRunnerWorkPath);
    const filterToRepoName = workContents.filter((contentName) => !contentName.startsWith('_'));

    const repoName = filterToRepoName[0];

    if (filterToRepoName.length !== 1 || !repoName) {
        throw new Error(
            `Unexpected matched repo name length of '${filterToRepoName.length}' in '${githubRunnerWorkPath}'`,
        );
    }

    const repoDir = join(githubRunnerWorkPath, repoName, repoName);

    return join(repoDir, 'node_modules');
}

const actionDir = resolve(__dirname, '..', '..');

export async function createNodeModulesSymLink() {
    const originalNodeModulesPath = await findNodeModulesPath();
    await symlink(originalNodeModulesPath, join(actionDir, 'node_modules'), 'file');
}
