import {check} from '@augment-vir/assert';
import {getOrSet} from '@augment-vir/common';
import {type ReviewRule} from '../config/config.js';

export type CodeOwners = {
    [Username in string]: string[] /** A list of matched code owned paths. */;
};

export function determineCodeOwners(
    rules: ReadonlyArray<Readonly<ReviewRule>>,
    changedFilePaths: ReadonlyArray<string>,
): CodeOwners {
    const codeOwners: CodeOwners = {};

    rules.forEach((rule) => {
        const ownership = rule.codeOwns;
        if (!ownership) {
            return;
        }

        changedFilePaths.forEach((filePath) => {
            const match = matchesCodeOwns(filePath, ownership.paths || []);
            const antiMatch = matchesCodeOwns(filePath, ownership.notPaths || []);

            if (!antiMatch && match) {
                (rule.users || []).forEach((user) => {
                    getOrSet(codeOwners, user, () => []).push(filePath);
                });
            }
        });
    });

    return codeOwners;
}

function matchesCodeOwns(filePath: string, ownership: ReadonlyArray<string | RegExp>): boolean {
    return ownership.some((ownerPath) => {
        if (check.isString(ownerPath)) {
            return filePath.includes(ownerPath);
        } else {
            return filePath.match(ownerPath);
        }
    });
}
