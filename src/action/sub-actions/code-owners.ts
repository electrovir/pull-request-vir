import {check} from '@augment-vir/assert';
import {type ReviewRule} from '../../config/config.js';

/**
 * @returns An array of usernames corresponding to the users that match code owner rules for this
 *   pull request.
 */
export function determineCodeOwners(
    rules: ReadonlyArray<Readonly<ReviewRule>>,
    changedFilePaths: ReadonlyArray<string>,
): string[] {
    const matchedRules = rules.filter((rule) => {
        const ownership = rule.codeOwns;
        if (!ownership) {
            return false;
        }

        const matches = changedFilePaths.some((filePath) => {
            return matchesCodeOwns(filePath, ownership.paths || []);
        });
        const matchesNot = changedFilePaths.some((filePath) => {
            return matchesCodeOwns(filePath, ownership.notPaths || []);
        });

        return !matchesNot && matches;
    });

    return matchedRules.flatMap((rule) => rule.users || []);
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
