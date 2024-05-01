import {log} from '@augment-vir/node-js';
import {SubActionParams} from '../sub-action-params';

export async function autoAssignAuthor({config, octokit, pullRequest, repo}: SubActionParams) {
    if (!config.assignToAuthor) {
        log.success('assignToAuthor config is false, skipping auto assignment.');
        return;
    }

    if (pullRequest.assignees?.length) {
        log.success('The pull request already has assignees, skipping auto assignment.');
        return;
    }

    if (!pullRequest.user) {
        throw new Error(
            `No user associated with pull request #${pullRequest.number}, cannot auto assign.`,
        );
    }

    if (pullRequest.user.type.toLowerCase() === 'bot') {
        log.success('The pull request author is a bot, skipping auto assignment.');
        return;
    }

    const authorUsername = pullRequest.user.login;

    if (!authorUsername) {
        throw new Error('Missing author username.');
    }

    await octokit.rest.issues.addAssignees({
        ...repo,
        issue_number: pullRequest.number,
        assignees: [authorUsername],
    });

    log.success(`'${authorUsername}' assigned to pull request #${pullRequest.number}`);
}
