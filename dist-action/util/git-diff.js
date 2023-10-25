"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listGitDiff = void 0;
const common_1 = require("@augment-vir/common");
async function listGitDiff(simpleGit) {
    const output = await simpleGit.raw([
        'diff-index',
        '--name-only',
        'HEAD',
    ]);
    return output
        .split('\n')
        .map((line) => line.trim())
        .filter(common_1.isTruthy);
}
exports.listGitDiff = listGitDiff;
