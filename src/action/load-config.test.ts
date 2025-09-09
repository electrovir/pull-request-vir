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
});
