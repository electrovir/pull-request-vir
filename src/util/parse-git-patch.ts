/*
    MIT License

    Copyright (c) 2020-2024 David Hérault

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
*/

/**
 * Copied from
 * https://github.com/dherault/parse-git-patch/blob/cfee38ddbc82037b6db099d6f35ea4990e7fc14c/src/index.ts
 * because the npm package's import wasn't working. Modified to meet ESLint rules.
 */

const hashRegex = /^From (\S*)/;
const authorRegex = /^From:\s?([^<].*[^>])?\s+(<(.*)>)?/;

// eslint-disable-next-line sonarjs/super-linear-regex
const fileNameRegex = /^diff --git "?a\/(.*)"?\s*"?b\/(.*)"?/;

// eslint-disable-next-line sonarjs/super-linear-regex
const fileLinesRegex = /^@@ -(\d*),?\S* \+(\d*),?/;

export type ParsedPatchModifiedLineType = {
    added: boolean;
    lineNumber: number;
    line: string;
};

export type ParsedPatchFileDataType = {
    added: boolean;
    deleted: boolean;
    beforeName: string;
    afterName: string;
    modifiedLines: ParsedPatchModifiedLineType[];
};

export type ParsedPatchType = {
    hash: string;
    authorName: string;
    authorEmail: string;
    date: string;
    message: string;
    files: ParsedPatchFileDataType[];
};

export function parseGitPatch(patch: string) {
    if (typeof patch !== 'string') {
        throw new TypeError('Expected first argument (patch) to be a string');
    }

    const lines = patch.split('\n');

    const gitPatchMetaInfo = splitMetaInfo(patch, lines);

    if (!gitPatchMetaInfo) {
        return null;
    }

    const parsedPatch = {
        ...gitPatchMetaInfo,
        files: [] as ParsedPatchFileDataType[],
    };

    splitIntoParts(lines, 'diff --git').forEach((diff) => {
        const fileNameLine = diff.shift();

        if (!fileNameLine) {
            return;
        }

        const match3 = fileNameLine.match(fileNameRegex);

        if (!match3) {
            return;
        }

        const [
            ,
            a,
            b,
        ] = match3;
        const metaLine = diff.shift();

        if (!metaLine) {
            return;
        }

        const fileData: ParsedPatchFileDataType = {
            added: false,
            deleted: false,
            beforeName: a?.trim() || '',
            afterName: b?.trim() || '',
            modifiedLines: [],
        };

        parsedPatch.files.push(fileData);

        if (metaLine.startsWith('new file mode ')) {
            fileData.added = true;
        }
        if (metaLine.startsWith('deleted file mode ')) {
            fileData.deleted = true;
        }
        if (metaLine.startsWith('similarity index ')) {
            return;
        }

        splitIntoParts(diff, '@@ ').forEach((lines) => {
            const fileLinesLine = lines.shift();

            if (!fileLinesLine) {
                return;
            }

            const match4 = fileLinesLine.match(fileLinesRegex);

            if (!match4) {
                return;
            }

            const [
                ,
                a,
                b,
            ] = match4;

            let nA = parseInt(a || '');
            let nB = parseInt(b || '');

            lines.forEach((line) => {
                nA++;
                nB++;

                if (line.startsWith('-- ')) {
                    return;
                }
                if (line.startsWith('+')) {
                    nA--;

                    fileData.modifiedLines.push({
                        added: true,
                        lineNumber: nB,
                        line: line.slice(1),
                    });
                } else if (line.startsWith('-')) {
                    nB--;

                    fileData.modifiedLines.push({
                        added: false,
                        lineNumber: nA,
                        line: line.slice(1),
                    });
                }
            });
        });
    });

    return parsedPatch;
}

function splitMetaInfo(patch: string, lines: string[]) {
    // Compatible with git output
    if (!patch.startsWith('From')) {
        return {};
    }

    const hashLine = lines.shift();

    if (!hashLine) {
        return null;
    }

    const match1 = hashLine.match(hashRegex);

    if (!match1) {
        return null;
    }

    const [
        ,
        hash,
    ] = match1;

    const authorLine = lines.shift();

    if (!authorLine) {
        return null;
    }

    const match2 = authorLine.match(authorRegex);

    if (!match2) {
        return null;
    }

    const [
        ,
        authorName,
        ,
        authorEmail,
    ] = match2;

    const dateLine = lines.shift();

    if (!dateLine) {
        return null;
    }

    const [
        ,
        date,
    ] = dateLine.split('Date: ');

    const messageLine = lines.shift();

    if (!messageLine) {
        return null;
    }

    const [
        ,
        message,
    ] = messageLine.split('Subject: ');

    return {
        hash,
        authorName,
        authorEmail,
        date,
        message,
    };
}

function splitIntoParts(lines: string[], separator: string): string[][] {
    const parts: string[][] = [];
    let currentPart: string[] | undefined;

    lines.forEach((line) => {
        if (line.startsWith(separator)) {
            if (currentPart) {
                parts.push(currentPart);
            }

            currentPart = [line];
        } else if (currentPart) {
            currentPart.push(line);
        }
    });

    if (currentPart) {
        parts.push(currentPart);
    }

    return parts;
}
