"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyFormatting = void 0;
const node_js_1 = require("@augment-vir/node-js");
const git_diff_1 = require("../../util/git-diff");
async function applyFormatting(git, command, cwd) {
    node_js_1.log.info('Applying format...');
    const initialChanges = await (0, git_diff_1.listGitDiff)(git);
    if (initialChanges.length) {
        node_js_1.log.error(initialChanges);
        throw new Error('Cannot apply format when there are already changes in the git index.');
    }
    await (0, node_js_1.runShellCommand)(command, { cwd, rejectOnError: true, hookUpToConsole: true });
    const formattedFiles = await (0, git_diff_1.listGitDiff)(git);
    if (formattedFiles.length) {
        node_js_1.log.faint(`The following files were formatted:\n    ${formattedFiles.join('\n    ')}`);
        node_js_1.log.faint('Committing and pushing format...');
        await git.add(formattedFiles);
        await git.commit('apply formatting', formattedFiles);
        await git.push();
    }
    else {
        node_js_1.log.faint('No files were formatted.');
    }
}
exports.applyFormatting = applyFormatting;
