import {getInput} from '@actions/core';
import {check} from '@augment-vir/assert';
import {
    RequiredAndNotNull,
    ensureErrorAndPrependMessage,
    extractErrorMessage,
    filterObject,
    log,
    mapObject,
    mergeDefinedProperties,
    wrapInTry,
} from '@augment-vir/common';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {assertValidShape} from 'object-shape-tester';
import {Config, PullRequestVirConfig, ReviewRule} from '../config/config.js';
import {
    FullPullRequestVirConfig,
    FullReviewRule,
    FullReviewRuleWithoutOverrides,
    pullRequestVirConfigShape,
} from '../config/pull-request-vir-config.js';
import {SilentError} from '../silent.error.js';
import {logJson} from '../util/log-json.js';

export async function loadConfig(repoDir: string): Promise<FullPullRequestVirConfig> {
    const configPath = join(
        repoDir,
        getInput('config_file', {trimWhitespace: true}) || './configs/pull-request-vir.config.ts',
    );

    log.faint(`Loading config at '${configPath}'`);

    const shouldLoadConfig = existsSync(configPath);

    if (!shouldLoadConfig) {
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
            const sanitizedRuleWithoutOverrides: FullReviewRuleWithoutOverrides = {
                ...reviewRule,
                users: Array.from(new Set(reviewRule.users.filter(check.isTruthy))),
                requiredIf: (reviewRule.requiredIf || []).filter(
                    (entry) => entry && (check.isString(entry) || entry instanceof RegExp),
                ),
                required: reviewRule.required ?? 'all',
            };
            return {
                ...sanitizedRuleWithoutOverrides,
                userOverrides: sanitizeUserOverrides(
                    reviewRule.userOverrides,
                    sanitizedRuleWithoutOverrides,
                ),
            };
        }),
    };
}

function sanitizeUserOverrides(
    userOverrides: Readonly<ReviewRule['userOverrides']>,
    fallbacks: FullReviewRuleWithoutOverrides,
): FullReviewRule['userOverrides'] {
    if (!userOverrides || !Object.keys(userOverrides).length) {
        return {};
    }

    return mapObject(userOverrides, (key, value) => {
        return {
            key,
            value: mergeDefinedProperties(fallbacks, value),
        };
    });
}
