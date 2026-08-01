import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {assertValidShape} from 'object-shape-tester';
import {pullRequestVirConfigShape} from '../config/config.js';
import {sanitizeConfig} from './load-config.js';

describe(sanitizeConfig.name, () => {
    it('produces a valid config', () => {
        assertValidShape(
            sanitizeConfig({
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
            }),
            pullRequestVirConfigShape,
        );
    });

    it('dedupes appliesTo usernames', () => {
        const sanitized = sanitizeConfig({
            reviewRules: [
                {
                    users: [
                        'a',
                    ],
                },
                {
                    users: [
                        'a',
                    ],
                    appliesTo: [
                        'b',
                        'b',
                        '',
                    ],
                },
            ],
        });

        assert.deepEquals(
            (sanitized.reviewRules || []).map((reviewRule) => reviewRule.appliesTo),
            [
                [],
                [
                    'b',
                ],
            ],
        );
    });
});
