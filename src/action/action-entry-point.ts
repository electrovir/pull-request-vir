import {createNodeModulesSymLink} from './fix-node-modules';

async function main() {
    await createNodeModulesSymLink();
    (await import('./run-action.js')).runAction();
}

if (require.main === module) {
    main();
}
