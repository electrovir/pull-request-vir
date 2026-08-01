import {getInput} from '@actions/core';
import {check} from '@augment-vir/assert';
import {
    ensureErrorAndPrependMessage,
    extractErrorMessage,
    filterObject,
    log,
    mapObject,
    mapObjectValues,
    mergeDefinedProperties,
    omitObjectKeys,
    removeDuplicates,
    wrapInTry,
} from '@augment-vir/common';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {assertValidShape} from 'object-shape-tester';
import {
    pullRequestVirConfigShape,
    type Config,
    type PullRequestVirConfig,
    type ReviewRule,
    type ReviewRuleWithoutOverrides,
} from '../config/config.js';
import {SilentError} from '../silent.error.js';
import {logJson} from '../util/log-json.js';

export async function loadConfig(repoDir: string): Promise<PullRequestVirConfig> {
    const configPath = join(
        repoDir,
        getInput('config_file', {
            trimWhitespace: true,
        }) || './configs/pull-request-vir.config.ts',
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
        throw ensureErrorAndPrependMessage(rawConfigInput, 'Failed to import config');
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

export function sanitizeConfig(rawConfig: PullRequestVirConfig): PullRequestVirConfig {
    const sanitizedConfig = filterObject(rawConfig, (key, value: unknown) => {
        return value != undefined;
    });

    return {
        ...pullRequestVirConfigShape.default,
        ...sanitizedConfig,
        reviewRules: (sanitizedConfig.reviewRules || []).map((reviewRule): ReviewRule => {
            const sanitizedRuleWithoutOverrides: ReviewRuleWithoutOverrides = {
                ...omitObjectKeys(reviewRule, ['userOverrides']),
                users: removeDuplicates(reviewRule.users || []).filter(check.isTruthy),
                appliesTo: removeDuplicates(reviewRule.appliesTo || []).filter(check.isTruthy),
                codeOwns: reviewRule.codeOwns
                    ? mapObjectValues(reviewRule.codeOwns, (key, paths) => {
                          return paths.filter(
                              (path) =>
                                  path && (check.isString(path) || check.instanceOf(path, RegExp)),
                          );
                      })
                    : undefined,
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
    fallbacks: ReviewRuleWithoutOverrides,
): ReviewRule['userOverrides'] {
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
