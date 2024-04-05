import {execSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const pullRequestVirRootDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const tsEntryPointFile = join(pullRequestVirRootDir, 'src', 'action', 'run-action.ts');
const pullRequestVirNodeModulesDir = join(pullRequestVirRootDir, 'node_modules');

async function runTypeScriptAction() {
    if (!existsSync(pullRequestVirNodeModulesDir)) {
        console.info('Installing dependencies...');
        execSync('npm ci --omit=dev', {
            cwd: pullRequestVirRootDir,
        });
    }

    console.info('Starting action...');
    const augmentVir = await import('@augment-vir/node-js');
    const {error} = await augmentVir.runShellCommand(
        `npx tsx ${augmentVir.interpolationSafeWindowsPath(tsEntryPointFile)} ${process.cwd()}`,
        {
            hookUpToConsole: true,
            cwd: pullRequestVirRootDir,
        },
    );

    if (error) {
        process.exit(1);
    }
}

runTypeScriptAction();
