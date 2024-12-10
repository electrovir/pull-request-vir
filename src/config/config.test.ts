import {describe, it} from '@augment-vir/test';
import {Config, PullRequestVirConfig, ReviewRule} from './config.js';

describe('PullRequestVirConfig', () => {
    it('allows an empty object', () => {
        const testAssignment: PullRequestVirConfig = {};
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
    });
});
