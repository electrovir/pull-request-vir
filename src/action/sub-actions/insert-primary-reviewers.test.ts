import {assert} from '@augment-vir/assert';
import {describe, it, itCases} from '@augment-vir/test';
import {parseDescriptionUsers} from '@review-vir/common';
import {type PullRequestVirConfig} from '../../config/config.js';
import {
    determineBodyWithPrimaryReviewers,
    determinePrimaryReviewers,
} from './insert-primary-reviewers.js';

function testDeterminePrimaryReviewers({
    reviewRules,
    author = 'author',
    assignees = [],
    codeOwners = {},
}: Readonly<{
    reviewRules: NonNullable<PullRequestVirConfig['reviewRules']>;
    author?: string;
    assignees?: string[];
    codeOwners?: Readonly<Record<string, string[]>>;
}>) {
    return determinePrimaryReviewers({
        config: {
            assignToAuthor: true,
            reviewRules,
        },
        pullRequest: {
            user: {
                login: author,
            },
            assignees: assignees.map((login) => {
                return {
                    login,
                };
            }),
        },
        reviews: {},
        codeOwners,
    });
}

describe(determinePrimaryReviewers.name, () => {
    itCases(testDeterminePrimaryReviewers, [
        {
            it: 'ignores rules that are not primary',
            input: {
                reviewRules: [
                    {
                        users: ['reviewer'],
                    },
                ],
            },
            expect: [],
        },
        {
            it: 'collects users from primary rules',
            input: {
                reviewRules: [
                    {
                        isPrimary: true,
                        users: [
                            'lead',
                            'other-lead',
                        ],
                    },
                    {
                        users: ['reviewer'],
                    },
                ],
            },
            expect: [
                'lead',
                'other-lead',
            ],
        },
        {
            it: 'excludes the author',
            input: {
                reviewRules: [
                    {
                        isPrimary: true,
                        users: [
                            'author',
                            'lead',
                        ],
                    },
                ],
            },
            expect: ['lead'],
        },
        {
            it: 'ignores a primary rule that does not apply to the assignees',
            input: {
                reviewRules: [
                    {
                        isPrimary: true,
                        users: ['lead'],
                        appliesTo: ['junior-dev'],
                    },
                ],
                assignees: ['senior-dev'],
            },
            expect: [],
        },
        {
            it: 'ignores a primary rule with unmatched code ownership',
            input: {
                reviewRules: [
                    {
                        isPrimary: true,
                        users: ['lead'],
                        codeOwns: {
                            paths: ['src/backend/'],
                        },
                    },
                ],
            },
            expect: [],
        },
        {
            it: 'includes a primary rule with matched code ownership',
            input: {
                reviewRules: [
                    {
                        isPrimary: true,
                        users: ['lead'],
                        codeOwns: {
                            paths: ['src/backend/'],
                        },
                    },
                ],
                codeOwners: {
                    lead: ['src/backend/thing.ts'],
                },
            },
            expect: ['lead'],
        },
        {
            it: 'uses a user override',
            input: {
                reviewRules: [
                    {
                        isPrimary: true,
                        users: ['lead'],
                        userOverrides: {
                            author: {
                                users: ['other-lead'],
                            },
                        },
                    },
                ],
            },
            expect: ['other-lead'],
        },
    ]);
});

const insertedBlock = [
    '<!-- primary reviewers start -->',
    '**Primary reviewer**: @lead',
    '',
    '<!-- primary reviewers end -->',
].join('\n');

describe(determineBodyWithPrimaryReviewers.name, () => {
    itCases(determineBodyWithPrimaryReviewers, [
        {
            it: 'inserts a block at the top of the body',
            input: {
                body: 'Intro.',
                primaryReviewers: ['lead'],
            },
            expect: [
                insertedBlock,
                '',
                'Intro.',
            ].join('\n'),
        },
        {
            it: 'pluralizes multiple primary reviewers',
            input: {
                body: '',
                primaryReviewers: [
                    'lead',
                    'other-lead',
                ],
            },
            expect: [
                '<!-- primary reviewers start -->',
                '**Primary reviewers**: @lead, @other-lead',
                '',
                '<!-- primary reviewers end -->',
                '',
                '',
            ].join('\n'),
        },
        {
            it: 'makes no changes when the block is already correct',
            input: {
                body: [
                    insertedBlock,
                    '',
                    'Intro.',
                ].join('\n'),
                primaryReviewers: ['lead'],
            },
            expect: undefined,
        },
        {
            it: 'replaces outdated primary reviewers',
            input: {
                body: [
                    insertedBlock,
                    '',
                    'Intro.',
                ].join('\n'),
                primaryReviewers: ['new-lead'],
            },
            expect: [
                '<!-- primary reviewers start -->',
                '**Primary reviewer**: @new-lead',
                '',
                '<!-- primary reviewers end -->',
                '',
                'Intro.',
            ].join('\n'),
        },
        {
            it: 'removes the block when no rules mark a primary reviewer',
            input: {
                body: [
                    insertedBlock,
                    '',
                    'Intro.',
                ].join('\n'),
                primaryReviewers: [],
            },
            expect: 'Intro.',
        },
        {
            it: 'leaves a manually written primary reviewer alone',
            input: {
                body: '**Primary reviewer**: @manual-lead\n',
                primaryReviewers: ['lead'],
            },
            expect: undefined,
        },
        {
            it: 'makes no changes to a body without primary reviewers',
            input: {
                body: 'Intro.',
                primaryReviewers: [],
            },
            expect: undefined,
        },
    ]);

    it('creates a block that review-vir parses', () => {
        assert.deepEquals(
            parseDescriptionUsers({
                triggerText: 'primary reviewer',
                bodyText:
                    determineBodyWithPrimaryReviewers({
                        body: 'Intro.\n\nMore words.',
                        primaryReviewers: [
                            'lead',
                            'other-lead',
                        ],
                    }) || '',
            }),
            [
                'lead',
                'other-lead',
            ],
        );
    });
});
