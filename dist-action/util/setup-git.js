"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupGit = void 0;
const simple_git_1 = __importDefault(require("simple-git"));
async function setupGit() {
    const git = (0, simple_git_1.default)();
    await git.addConfig('user.name', 'vir-action-bot', undefined, 'global');
    await git.addConfig('user.email', '149797500+vir-action-bot@users.noreply.github.com', undefined, 'global');
    return git;
}
exports.setupGit = setupGit;
