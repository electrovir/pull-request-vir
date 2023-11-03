"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fix_node_modules_1 = require("./fix-node-modules");
async function main() {
    await (0, fix_node_modules_1.createNodeModulesSymLink)();
    (await import('./run-action.js')).runAction();
}
if (require.main === module) {
    main();
}
