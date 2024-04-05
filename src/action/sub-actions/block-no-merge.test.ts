import {assert} from 'chai';
import {includesNoMergePhrase} from './block-no-merge';

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
});
