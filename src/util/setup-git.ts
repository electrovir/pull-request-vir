import simpleGit from 'simple-git';

export async function setupGit() {
    const git = simpleGit();
    await git.addConfig('user.name', 'vir-action-bot', undefined, 'global');
    await git.addConfig(
        'user.email',
        '149797500+vir-action-bot@users.noreply.github.com',
        undefined,
        'global',
    );

    return git;
}
