import {PullRequestVirConfig, ReviewRule, definePullRequestVirConfig} from './define-config';

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
                requiredIf: [
                    'hi',
                    /hi/,
                ],
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

describe(definePullRequestVirConfig.name, () => {
    it('defines an example config', () => {
        definePullRequestVirConfig({
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
                    requiredIf: [
                        'stuff',
                        /stuff/,
                    ],
                },
            ],
        });
    });
});
