import {describe, itCases} from '@augment-vir/test';
import {determineNewPullRequestBody} from './insert-code-owners.js';

const pullRequestUrl = 'https://github.com/electrovir/pull-request-vir/pull/7';

const expectedCodeOwnersBlock = [
    '<!-- code owners start -->',
    '**Code owners**:',
    '<details>',
    '<summary>@electrovir Owned files</summary>',
    '',
    '- [src/action/run-action.ts](https://github.com/electrovir/pull-request-vir/pull/7/files#diff-edd976ebce4f79a178d05195d02f813ef076dc43fb743d9496e6b723de424b33)',
    '',
    '</details>',
    '<details>',
    '<summary>@other-owner Owned files</summary>',
    '',
    '- [src/action/sub-actions/insert-code-owners.ts](https://github.com/electrovir/pull-request-vir/pull/7/files#diff-2ee178aac46aca9e121d9dc2de7e8d8cc824504c8e0e2eb131fd8d9c0e87fada)',
    '',
    '</details>',
    '<!-- code owners end -->',
].join('\n');

const oldCodeOwnersBlock = [
    '<!-- code owners start -->',
    '**Code owners**: @old-owner',
    '<details>',
    '<summary>Owned files</summary>',
    '',
    '- old/path.ts',
    '',
    '</details>',
    '<!-- code owners end -->',
].join('\n');

describe(determineNewPullRequestBody.name, () => {
    itCases(determineNewPullRequestBody, [
        {
            it: 'inserts code owners with owned file links after the primary reviewer',
            input: {
                author: 'author',
                body: [
                    'Intro.',
                    '',
                    '**Primary reviewer**: @lead',
                    '',
                    'Rest.',
                ].join('\n'),
                codeOwners: {
                    electrovir: [
                        'src/action/run-action.ts',
                        'src/action/run-action.ts',
                    ],
                    'other-owner': [
                        'src/action/sub-actions/insert-code-owners.ts',
                    ],
                    author: [
                        'README.md',
                    ],
                },
                pullRequestUrl,
            },
            expect: [
                'Intro.',
                '',
                '**Primary reviewer**: @lead',
                expectedCodeOwnersBlock,
                'Rest.',
            ].join('\n'),
        },
        {
            it: 'replaces an existing code owners block that contains details elements',
            input: {
                author: 'author',
                body: [
                    'Intro.',
                    oldCodeOwnersBlock,
                    'Rest.',
                ].join('\n'),
                codeOwners: {
                    electrovir: [
                        'src/action/run-action.ts',
                    ],
                    'other-owner': [
                        'src/action/sub-actions/insert-code-owners.ts',
                    ],
                },
                pullRequestUrl,
            },
            expect: [
                'Intro.',
                expectedCodeOwnersBlock,
                'Rest.',
            ].join('\n'),
        },
        {
            it: 'removes an existing code owners block when the author is the only owner',
            input: {
                author: 'author',
                body: oldCodeOwnersBlock,
                codeOwners: {
                    author: [
                        'README.md',
                    ],
                },
                pullRequestUrl,
            },
            expect: '',
        },
    ]);
});
