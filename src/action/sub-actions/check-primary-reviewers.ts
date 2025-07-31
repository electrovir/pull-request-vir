import {joinWithFinalConjunction, log} from '@augment-vir/common';
import {parseDescriptionUsers} from '@review-vir/common';
import {type ScriptParams} from '../../config/config.js';

export function checkPrimaryReviewers({config, reviews, pullRequest}: ScriptParams) {
    if (!config.checkPrimaryReviewer) {
        log.success('primary reviewer is disabled, skipping check.');
        return;
    }

    const primaryReviewers = parseDescriptionUsers({
        triggerText: 'primary reviewer',
        bodyText: pullRequest.body || '',
    });

    if (!primaryReviewers.length) {
        throw new Error('No primary reviewers detected.');
    }

    log.faint(`Primary reviewers: ${primaryReviewers.join(',')}`);

    const primaryReviewersMissingApproval = primaryReviewers.filter(
        (primaryReviewer) => !reviews[primaryReviewer],
    );

    if (primaryReviewersMissingApproval.length) {
        throw new Error(
            `Missing approvals from primary reviewers: ${joinWithFinalConjunction(primaryReviewersMissingApproval, 'and')}`,
        );
    }

    log.success('All primary reviewers have approved.');
}
