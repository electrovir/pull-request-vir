import {log, safeMatch, type SelectFrom} from '@augment-vir/common';
import {ScriptParams} from '../../config/config.js';

const codeOwnersComments = {
    start: '<!-- code owners start -->',
    end: '<!-- code owners end -->',
};

const codeOwnersCommentsRegExp = new RegExp(
    `${codeOwnersComments.start}[^<]*${codeOwnersComments.end}`,
);

export async function insertCodeOwners({
    config,
    octokit,
    pullRequest,
    codeOwners,
    repo,
}: Readonly<
    SelectFrom<
        ScriptParams,
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
                user: {
                    login: true;
                };
            };
            codeOwners: true;
        }
    >
>): Promise<void> {
    if (!config.insertCodeOwners) {
        log.success('Skipping code owners insertion.');
        return;
    }

    const newBody = determineNewPullRequestBody(
        Object.keys(codeOwners).filter((codeOwner) => codeOwner !== pullRequest.user?.login),
        pullRequest.body || '',
    );

    if (!newBody) {
        log.success('No code owners to insert.');
        return;
    }

    await octokit.rest.pulls.update({
        owner: repo.owner,
        pull_number: pullRequest.number,
        repo: repo.repo,
        body: newBody,
    });

    log.success('Code owners inserted.');
}

function determineNewPullRequestBody(
    codeOwners: ReadonlyArray<string>,
    body: string,
): string | undefined {
    const codeOwnersInsertionIndex = findCodeOwnersInsertionIndex(body || '');

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

    if (!codeOwners.length) {
        if (body.includes(codeOwnersComments.start)) {
            return body.replace(codeOwnersCommentsRegExp, '');
        } else {
            return undefined;
        }
    } else if (body.includes(codeOwnersComments.start)) {
        return body.replace(codeOwnersCommentsRegExp, codeOwnersString);
    } else if (codeOwnersInsertionIndex == undefined) {
        return body + codeOwnersString;
    } else {
        return (
            body.slice(0, codeOwnersInsertionIndex) +
            codeOwnersString +
            body.slice(codeOwnersInsertionIndex)
        );
    }
}

function findCodeOwnersInsertionIndex(body: string): number | undefined {
    if (!body) {
        return undefined;
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
        return undefined;
    }
}
