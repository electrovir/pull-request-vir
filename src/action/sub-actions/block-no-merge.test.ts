import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {type ScriptParams} from '../../config/config.js';
import {SilentError} from '../../silent.error.js';
import {blockNoMerge, includesNoMergePhrase} from './block-no-merge.js';

type CreateBlockNoMergeParamsParams = Readonly<{
    diffOutput: string;
    labels: ReadonlyArray<string>;
    title: string;
}>;

describe(includesNoMergePhrase.name, () => {
    const matchCases = [
        'nomerge',
        'no-merge',
        'no merge',
        "// please don't merge this",
        '// nomerge',
        'stuff\nno merge\nmore stuff',
    ];

    const noMatchCases = [
        'some stuff in here',
        'lets talk about merging',
        'piano merge',
    ];

    it('matches all match cases', () => {
        matchCases.forEach((matchCase) => {
            assert.isTrue(
                includesNoMergePhrase(matchCase),
                `'${matchCase}' should include a no merge phrase`,
            );
        });
    });

    it('does not match no match cases', () => {
        noMatchCases.forEach((noMatchCase) => {
            assert.isFalse(
                includesNoMergePhrase(noMatchCase),
                `'${noMatchCase}' should not include a no merge phrase`,
            );
        });
    });

    it('checks added lines with local git diff instead of the GitHub patch endpoint', async () => {
        await blockNoMerge(
            createBlockNoMergeParams({
                diffOutput: [
                    'diff --git a/src/file.ts b/src/file.ts',
                    'index 1111111..2222222 100644',
                    '--- a/src/file.ts',
                    '+++ b/src/file.ts',
                    '@@ -1 +1,2 @@',
                    ' const canMerge = true;',
                    '+const stillCanMerge = true;',
                ].join('\n'),
                labels: [],
                title: 'Ready to merge.',
            }),
        );
    });

    it('fails when local git diff contains a no merge phrase in an added line', async () => {
        await assert.throws(
            blockNoMerge(
                createBlockNoMergeParams({
                    diffOutput: [
                        'diff --git a/src/file.ts b/src/file.ts',
                        'index 1111111..2222222 100644',
                        '--- a/src/file.ts',
                        '+++ b/src/file.ts',
                        '@@ -1 +1,2 @@',
                        ' const canMerge = true;',
                        '+// no merge',
                    ].join('\n'),
                    labels: [],
                    title: 'Ready to merge.',
                }),
            ),
            {
                matchConstructor: SilentError,
            },
        );
    });
});

function createBlockNoMergeParams({
    diffOutput,
    labels,
    title,
}: CreateBlockNoMergeParamsParams): ScriptParams {
    return {
        changedFilePaths: [],
        codeOwners: {},
        config: {
            blockNoMerge: true,
        },
        git: {
            diff: () => Promise.resolve(diffOutput),
            raw: () => Promise.resolve('merge-base-sha\n'),
        },
        octokit: {
            rest: {
                pulls: {
                    get: () =>
                        Promise.reject(new Error('GitHub patch endpoint should not be used.')),
                },
            },
        },
        pullRequest: {
            base: {
                sha: 'base-sha',
            },
            head: {
                sha: 'head-sha',
            },
            labels: labels.map((name) => {
                return {
                    name,
                };
            }),
            number: 1,
            title,
        },
        repo: {
            owner: 'test',
            repo: 'test',
        },
        repoDir: '',
        reviews: {},
    } satisfies Record<string, unknown> as unknown as ScriptParams;
}
