import {log, safeMatch, type SelectFrom} from '@augment-vir/common';
import {SubActionParams} from '../sub-action-params.js';

const codeOwnersComments = {
    start: '<!-- code owners start -->',
    end: '<!-- code owners end -->',
};

export async function insertCodeOwners({
    config,
    octokit,
    pullRequest,
    codeOwners,
    repo,
}: Readonly<
    SelectFrom<
        SubActionParams,
        {
            repo: {
                owner: true;
                repo: true;
            };
            config: {
                insertCodeOwners: true;
            };
            octokit: true;
            pullRequest: {
                number: true;
                body: true;
            };
            codeOwners: true;
        }
    >
>): Promise<void> {
    if (!config.insertCodeOwners) {
        log.success('Skipping code owners insertion.');
        return;
    } else if (!codeOwners.length) {
        log.success('No code owners to insert.');
        return;
    }

    const codeOwnersInsertionIndex = findCodeOwnersInsertionIndex(pullRequest.body || '');

    const codeOwnersString = [
        codeOwnersComments.start,
        '\n',
        '**',
        'Code owners',
        '**',
        ': ',
        codeOwners.map((username) => `@${username}`).join(', '),
        '\n',
        codeOwnersComments.end,
    ].join('');

    const newBody = pullRequest.body
        ? pullRequest.body.includes(codeOwnersComments.start)
            ? pullRequest.body
                  .replace(codeOwnersComments.end, '')
                  .replace(codeOwnersComments.start, codeOwnersString)
            : pullRequest.body.slice(0, codeOwnersInsertionIndex) +
              codeOwnersString +
              pullRequest.body.slice(codeOwnersInsertionIndex)
        : codeOwnersString;

    await octokit.rest.pulls.update({
        owner: repo.owner,
        pull_number: pullRequest.number,
        repo: repo.repo,
        body: newBody,
    });

    log.success('Code owners inserted.');
}

function findCodeOwnersInsertionIndex(body: string): number {
    if (!body) {
        return 0;
    }

    const [primaryReviewerMatch] = safeMatch(body, /primary reviewers?\*?\*?:/i);

    if (primaryReviewerMatch) {
        const primaryReviewerIndex = body.indexOf(primaryReviewerMatch);
        const nextLineIndex = body.indexOf('\n', primaryReviewerIndex);

        if (nextLineIndex < 0) {
            return primaryReviewerIndex + 1;
        } else {
            return nextLineIndex + 1;
        }
    } else {
        return body.length;
    }
}
