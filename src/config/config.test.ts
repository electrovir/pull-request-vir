import {describe, it} from '@augment-vir/test';
import {assertValidShape} from 'object-shape-tester';
import {
    pullRequestVirConfigShape,
    reviewRuleShape,
    type Config,
    type PullRequestVirConfig,
    type ReviewRule,
} from './config.js';

describe('PullRequestVirConfig', () => {
    it('allows an empty object', () => {
        const testAssignment: PullRequestVirConfig = {};
        assertValidShape(testAssignment, pullRequestVirConfigShape);
    });
});

describe('ReviewRule', () => {
    it('matches correct values', () => {
        const goodAssignments: ReviewRule[] = [
            {
                autoAdd: false,
                users: [
                    'user1',
                    'user2',
                ],
                required: 'all',
                codeOwns: {
                    paths: [
                        'hi',
                        /hi/,
                    ],
                },
            },
            {
                autoAdd: false,
                users: [
                    'user1',
                    'user2',
                ],
                required: 'all',
            },
        ];
        goodAssignments.forEach((goodAssignment) => {
            assertValidShape(goodAssignment, reviewRuleShape);
        });
    });

    it('does not match incorrect values', () => {
        const badAssignments: ReviewRule[] = [
            {
                autoAdd: false,
                users: [
                    'user1',
                    'user2',
                ],
                // @ts-expect-error: unexpected property
                fakeProp: 'hi',
            },
        ];
    });
});

describe('Config', () => {
    it('accepts a larger config', () => {
        assertValidShape(
            {
                assignToAuthor: true,
                blockNoMerge: true,
                checkPrimaryReviewer: false,
                ignoreDraft: true,
                insertCodeOwners: true,
                waitForParentPullRequest: true,
                reviewRules: [
                    {
                        autoAdd: true,
                        users: [
                            'electrovir',
                        ],
                        required: 1,
                        userOverrides: {
                            electrovir: {
                                required: 0,
                            },
                        },
                    },
                    {
                        autoAdd: false,
                        users: ['electrovir'],
                    },
                ],
            } satisfies Config,
            pullRequestVirConfigShape,
        );

        const value: Config = {
            assignToAuthor: true,
            blockNoMerge: true,
            checkPrimaryReviewer: false,
            ignoreDraft: true,
            insertCodeOwners: true,
            waitForParentPullRequest: true,
            reviewRules: [
                {
                    autoAdd: true,
                    users: [
                        'electrovir',
                    ],
                    required: 1,
                    userOverrides: {
                        electrovir: {
                            required: 0,
                        },
                    },
                },
                {
                    autoAdd: false,
                    users: ['electrovir'],
                },
            ],
        };
    });
    it('accepts an example config', () => {
        const config: Config = {
            assignToAuthor: true,
            blockNoMerge: true,
            reviewRules: [
                {
                    autoAdd: true,
                    users: [
                        'electrovir',
                        'another-user',
                        'ghost',
                    ],
                    required: 2,
                    codeOwns: {
                        paths: [
                            'stuff',
                            /stuff/,
                        ],
                    },
                },
            ],
        };
        assertValidShape(config, pullRequestVirConfigShape);
    });
    it('allows user overrides', () => {
        const config: Config = {
            reviewRules: [
                {
                    autoAdd: true,
                    users: [
                        'a',
                        'b',
                    ],
                    required: 2,
                    codeOwns: {},
                    userOverrides: {
                        c: {
                            required: 1,
                        },
                    },
                },
            ],
        };
        assertValidShape(config, pullRequestVirConfigShape);
    });
});
