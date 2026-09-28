import {removeDuplicates, safeMatch} from '@augment-vir/common';
import {codeOwnersMarkdown, createCodeOwnersMarkdownBlock} from '@review-vir/common';
import {createHash} from 'node:crypto';
import {type CodeOwners} from '../../config/config.js';
import {primaryReviewersComments} from './insert-primary-reviewers.js';

const codeOwnersCommentsRegExp = new RegExp(
    String.raw`${codeOwnersMarkdown.blockStart}[\S\s]*?${codeOwnersMarkdown.blockEnd}`,
);

type DetermineNewPullRequestBodyParams = Readonly<{
    author: string | undefined;
    body: string;
    codeOwners: Readonly<CodeOwners>;
    pullRequestUrl: string;
}>;

type CreateCodeOwnerEntriesParams = Readonly<{
    author: string | undefined;
    codeOwners: Readonly<CodeOwners>;
    pullRequestUrl: string;
}>;

type CodeOwnedFileLink = Readonly<{
    filePath: string;
    url: string;
}>;

type CodeOwnerEntry = Readonly<{
    username: string;
    fileLinks: ReadonlyArray<CodeOwnedFileLink>;
}>;

export function determineNewPullRequestBody({
    author,
    body,
    codeOwners,
    pullRequestUrl,
}: DetermineNewPullRequestBodyParams): string | undefined {
    const codeOwnerEntries = createCodeOwnerEntries({
        author,
        codeOwners,
        pullRequestUrl,
    });
    const codeOwnersInsertionIndex = findCodeOwnersInsertionIndex(body);

    const codeOwnersString = createCodeOwnersMarkdownBlock(
        codeOwnerEntries.map(createCodeOwnerSection).join('\n'),
    );

    if (!codeOwnerEntries.length) {
        if (body.includes(codeOwnersMarkdown.blockStart)) {
            return body.replace(codeOwnersCommentsRegExp, '');
        } else {
            return undefined;
        }
    }

    const existingBlock = codeOwnersCommentsRegExp.exec(body);

    if (existingBlock) {
        return insertCodeOwnersString({
            before: body.slice(0, existingBlock.index),
            codeOwnersString,
            after: body.slice(existingBlock.index + existingBlock[0].length),
        });
    } else if (codeOwnersInsertionIndex == undefined) {
        return insertCodeOwnersString({
            before: body,
            codeOwnersString,
            after: '',
        });
    } else {
        return insertCodeOwnersString({
            before: body.slice(0, codeOwnersInsertionIndex),
            codeOwnersString,
            after: body.slice(codeOwnersInsertionIndex),
        });
    }
}

/** Separates the code owners block from any preceding text with a blank line. */
function insertCodeOwnersString({
    before,
    codeOwnersString,
    after,
}: Readonly<{
    before: string;
    codeOwnersString: string;
    after: string;
}>): string {
    return [
        before ? before.replace(/\n{0,2}$/, '\n\n') : '',
        codeOwnersString,
        after,
    ].join('');
}

function createCodeOwnerEntries({
    author,
    codeOwners,
    pullRequestUrl,
}: CreateCodeOwnerEntriesParams): CodeOwnerEntry[] {
    return Object.entries(codeOwners)
        .filter(([username]) => username !== author)
        .map(
            ([
                username,
                filePaths,
            ]) => {
                return {
                    username,
                    fileLinks: removeDuplicates(filePaths).map((filePath) => {
                        return {
                            filePath,
                            url: createPullRequestFileUrl({
                                filePath,
                                pullRequestUrl,
                            }),
                        };
                    }),
                };
            },
        );
}

function createCodeOwnerSection({fileLinks, username}: CodeOwnerEntry): string {
    return [
        '<details>',
        `<summary>@${username} Owned files</summary>`,
        '',
        ...fileLinks.map(({filePath, url}) => {
            return `- [${escapeMarkdownLinkText({
                filePath,
            })}](${url})`;
        }),
        '',
        '</details>',
    ].join('\n');
}

function createPullRequestFileUrl({
    filePath,
    pullRequestUrl,
}: Readonly<{
    filePath: string;
    pullRequestUrl: string;
}>): string {
    return [
        pullRequestUrl.replace(/\/$/, ''),
        '/files#diff-',
        createHash('sha256').update(filePath).digest('hex'),
    ].join('');
}

function escapeMarkdownLinkText({
    filePath,
}: Readonly<{
    filePath: string;
}>): string {
    return filePath
        .replaceAll(/\\/g, String.raw`\\`)
        .replaceAll('[', String.raw`\[`)
        .replaceAll(']', String.raw`\]`);
}

function findCodeOwnersInsertionIndex(body: string): number | undefined {
    if (!body) {
        return undefined;
    }

    /**
     * Insert after the whole inserted primary reviewers block, if there is one, so that its markers
     * and its parser-required trailing blank line stay intact.
     */
    const [primaryReviewerMatch] = body.includes(primaryReviewersComments.end)
        ? [primaryReviewersComments.end]
        : safeMatch(body, /primary reviewers?\*?\*?:/i);

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
