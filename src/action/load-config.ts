import {getInput} from '@actions/core';
import {
    RequiredAndNotNull,
    ensureErrorAndPrependMessage,
    extractErrorMessage,
    filterObject,
    isTruthy,
    wrapInTry,
} from '@augment-vir/common';
import {log} from '@augment-vir/node-js';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {assertValidShape} from 'object-shape-tester';
import {isRunTimeType} from 'run-time-assertions';
import {Config, PullRequestVirConfig} from '../config/define-config';
import {
    FullPullRequestVirConfig,
    pullRequestVirConfigShape,
} from '../config/pull-request-vir-config';
import {SilentError} from '../silent.error';
import {logJson} from '../util/log-json';

export async function loadConfig(repoDir: string): Promise<FullPullRequestVirConfig> {
    const configPath = join(
        repoDir,
        getInput('config_file', {trimWhitespace: true}) || './configs/pull-request-vir.config.ts',
    );

    log.faint(`Loading config at '${configPath}'`);

    const shouldLoadConfig = existsSync(configPath);

    if (shouldLoadConfig) {
        log.warning('Config does not exist. Using default values.');
    }

    const rawConfigInput: Config = shouldLoadConfig
        ? await wrapInTry(async () => (await import(configPath)).config)
        : {};

    if (rawConfigInput instanceof Error) {
        throw ensureErrorAndPrependMessage(rawConfigInput, `Failed to import config`);
    }

    const rawConfig =
        typeof rawConfigInput === 'function' ? await rawConfigInput() : await rawConfigInput;

    const sanitizedConfig = sanitizeConfig(rawConfig);

    log.faint('');
    log.faint('config loaded:');
    logJson(sanitizedConfig, 'faint');

    try {
        assertValidShape(sanitizedConfig, pullRequestVirConfigShape);
    } catch (error) {
        log.error('Invalid config:');
        log.error(extractErrorMessage(error));
        throw new SilentError();
    }

    return sanitizedConfig;
}

function sanitizeConfig(rawConfig: PullRequestVirConfig): FullPullRequestVirConfig {
    const sanitizedConfig = filterObject(rawConfig, (key, value) => {
        return value != undefined;
    }) as Partial<RequiredAndNotNull<PullRequestVirConfig>>;

    return {
        ...pullRequestVirConfigShape.defaultValue,
        ...sanitizedConfig,
        reviewRules: (sanitizedConfig.reviewRules || []).map((reviewRule) => {
            return {
                ...reviewRule,
                users: Array.from(new Set(reviewRule.users.filter(isTruthy))),
                requiredIf: (reviewRule.requiredIf || []).filter(
                    (entry) => entry && (isRunTimeType(entry, 'string') || entry instanceof RegExp),
                ),
                required: reviewRule.required ?? 'all',
            };
        }),
    };
}
