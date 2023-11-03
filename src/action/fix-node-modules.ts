import {symlink} from 'fs/promises';
import {join, resolve} from 'path';

const actionDir = resolve(__dirname, '..', '..');

export async function createNodeModulesSymLink() {
    await symlink(join(process.cwd(), 'node_modules'), join(actionDir, 'node_modules'), 'file');
}
