import {describe, itCases} from '@augment-vir/test';
import type {PullRequestVirConfig} from '../../config/config.js';
import {SilentError} from '../../silent.error.js';
import {PullRequestReviews} from '../sub-action-params.js';
import {requireReviewers} from './require-reviewers.js';

describe(requireReviewers.name, () => {
    async function testRequireReviewers(
        rules: NonNullable<PullRequestVirConfig['reviewRules']>,
        reviews: Readonly<PullRequestReviews>,
        author: string = 'test',
        changedFiles: string[] = [],
    ) {
        await requireReviewers({
            config: {
                reviewRules: rules,
            },
            octokit: {
                rest: {
                    pulls: {
                        listFiles: (() => {
                            return {
                                data: changedFiles.map((filename) => {
                                    return {filename};
                                }),
                            };
                        }) as any,
                        requestReviewers: (() => {
                            // this return value is not used
                            return undefined;
                        }) as any,
                    },
                },
            },
            pullRequest: {
                number: 1,
                user: {
                    login: author,
                },
            },
            repo: {
                owner: 'test',
                repo: 'test',
            },
            reviews,
            codeOwners: [],
        });
    }

    itCases(testRequireReviewers, [
        {
            it: 'passes with no rules',
            inputs: [
                [],
                {a: true},
            ],
            throws: undefined,
        },
        {
            it: 'passes with 1 required review',
            inputs: [
                [
                    {
                        autoAdd: true,
                        required: 1,
                        codeOwns: {},
                        userOverrides: {},
                        users: [
                            'a',
                            'b',
                        ],
                    },
                ],
                {
                    a: true,
                },
            ],
            throws: undefined,
        },
        {
            it: 'fails with a missing required review',
            inputs: [
                [
                    {
                        autoAdd: true,
                        required: 2,
                        codeOwns: {},
                        userOverrides: {
                            c: {
                                autoAdd: true,
                                required: 1,
                                codeOwns: undefined,
                                users: [
                                    'a',
                                    'b',
                                ],
                            },
                        },
                        users: [
                            'a',
                            'b',
                        ],
                    },
                ],
                {
                    a: true,
                },
            ],
            throws: {
                matchConstructor: SilentError,
            },
        },
        {
            it: 'passes with a missing required review that is overridden',
            inputs: [
                [
                    {
                        autoAdd: true,
                        required: 2,
                        codeOwns: {},
                        userOverrides: {
                            c: {
                                autoAdd: true,
                                required: 1,
                                codeOwns: {},
                                users: [
                                    'a',
                                    'b',
                                ],
                            },
                        },
                        users: [
                            'a',
                            'b',
                        ],
                    },
                ],
                {
                    a: true,
                },
                'c',
            ],
            throws: undefined,
        },
    ]);
});
