"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNodeModulesSymLink = void 0;
const promises_1 = require("fs/promises");
const path_1 = require("path");
const actionDir = (0, path_1.resolve)(__dirname, '..', '..');
async function createNodeModulesSymLink() {
    await (0, promises_1.symlink)((0, path_1.join)(process.cwd(), 'node_modules'), (0, path_1.join)(actionDir, 'node_modules'), 'file');
}
exports.createNodeModulesSymLink = createNodeModulesSymLink;
