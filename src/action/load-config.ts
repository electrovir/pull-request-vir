import {getInput} from '@actions/core';
import {log} from '@augment-vir/node-js';
import {transformFile} from '@swc/core';
import {existsSync} from 'fs';
import {mkdir, writeFile} from 'fs/promises';
import {assertValidShape} from 'object-shape-tester';
import {dirname, join, resolve} from 'path';
import {
    PullRequestVirConfig,
    defaultPullRequestVirConfig,
    pullRequestVirConfigShape,
} from '../config/pull-request-vir-config';

export async function loadConfig(): Promise<PullRequestVirConfig> {
    const configFilePath = resolve(
        getInput('config-file', {trimWhitespace: true}) || './configs/internal-action.config.ts',
    );
    log.info(`Loading config at '${configFilePath}'...`);

    if (!existsSync(configFilePath)) {
        log.faint('Config does not exist. Using default values.');
        return defaultPullRequestVirConfig;
    }

    const outputPath = join(process.cwd(), 'node_modules', 'pull-request-vir', 'config-output.js');
    await mkdir(dirname(outputPath), {recursive: true});

    const output = await transformFile(configFilePath, {
        isModule: true,
        module: {
            type: 'commonjs',
        },
    });
    await writeFile(outputPath, output.code);
    const config = (await import(join('pull-request-vir', 'config-output.js'))).default.default;

    assertValidShape(config, pullRequestVirConfigShape);

    log.faint('config loaded:');
    log.faint(
        JSON.stringify(config, null, 4)
            .split('\n')
            .map((line) => `    ${line}`)
            .join('\n'),
    );

    return config;
}
