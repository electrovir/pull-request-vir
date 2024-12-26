import {joinWithFinalConjunction, log} from '@augment-vir/common';
import {ScriptParams} from '../../config/config.js';
import {SilentError} from '../../silent.error.js';
import {logJson} from '../../util/log-json.js';
import {parseGitPatch} from '../../util/parse-git-patch.js';

export async function blockNoMerge({config, octokit, pullRequest, repo}: ScriptParams) {
    if (!config.blockNoMerge) {
        log.success('"no merge" phrases are disabled, skipping check.');
        return;
    }

    const noMergeLabels = pullRequest.labels
        .map((label) => label.name)
        .filter((label) => includesNoMergePhrase(label));

    const hasNoMergeTitle = includesNoMergePhrase(pullRequest.title);

    const patchContents = (
        await octokit.rest.pulls.get({
            ...repo,
            pull_number: pullRequest.number,
            mediaType: {
                format: 'patch',
            },
        })
    ).data as unknown as string;

    const patch = parseGitPatch(patchContents);

    if (!patch) {
        log.error('Failed to parse patch:');
        log.error(patchContents);

        throw new SilentError();
    }

    const noMergeLines = patch.files.flatMap((file) => {
        return file.modifiedLines.filter((line) => {
            return line.added && includesNoMergePhrase(line.line);
        });
    });

    if (noMergeLabels.length) {
        log.error(
            `Contains "no merge" phrase in pull request label(s):\n    ${joinWithFinalConjunction(noMergeLabels, 'and')}`,
        );
    }
    if (hasNoMergeTitle) {
        log.error(`Contains "no merge" phrase in pull request title:\n    ${pullRequest.title}`);
    }
    if (noMergeLines.length) {
        log.error('Contains "no merge" phrases in added code:');
        logJson(noMergeLines, 'error');
    }

    if (noMergeLabels.length || hasNoMergeTitle || noMergeLines.length) {
        throw new SilentError();
    }

    log.success('No "no merge" phrases detected.');
}

const baseNoMergePhrases = [
    'no merge',
    'not merge',
    "don't merge",
    'block merge',
];

const expandedNoMergePhrases = baseNoMergePhrases.flatMap((phrase) => [
    phrase,
    phrase.replace(' ', '-'),
    phrase.replace(' ', ''),
]);

const noMergeRegExp = new RegExp(`\\b(?:${expandedNoMergePhrases.join('|')})\\b`, 'i');

export function includesNoMergePhrase(text: string): boolean {
    return !!text.match(noMergeRegExp);
}
