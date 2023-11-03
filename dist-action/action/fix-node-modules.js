"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNodeModulesSymLink = void 0;
const promises_1 = require("fs/promises");
const path_1 = require("path");
async function findNodeModulesPath() {
    const thisActionPath = (0, path_1.join)('electrovir', 'pull-request-vir');
    const githubRunnerWorkPath = process.cwd().split(thisActionPath)[0];
    if (!githubRunnerWorkPath) {
        throw new Error(`Failed to find work directory.`);
    }
    const workContents = await (0, promises_1.readdir)(githubRunnerWorkPath);
    const filterToRepoName = workContents.filter((contentName) => !contentName.startsWith('_'));
    const repoName = filterToRepoName[0];
    if (filterToRepoName.length !== 1 || !repoName) {
        throw new Error(`Unexpected matched repo name length of '${filterToRepoName.length}' in '${githubRunnerWorkPath}'`);
    }
    const repoDir = (0, path_1.join)(githubRunnerWorkPath, repoName, repoName);
    return (0, path_1.join)(repoDir, 'node_modules');
}
const actionDir = (0, path_1.resolve)(__dirname, '..', '..');
async function createNodeModulesSymLink() {
    const originalNodeModulesPath = await findNodeModulesPath();
    await (0, promises_1.symlink)(originalNodeModulesPath, (0, path_1.join)(actionDir, 'node_modules'), 'file');
}
exports.createNodeModulesSymLink = createNodeModulesSymLink;
