import {baseTypedocConfig} from '@virmator/docs/configs/typedoc.config.base';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {type TypeDocOptions} from 'typedoc';

const indexTsFile = join(dirname(dirname(fileURLToPath(import.meta.url))), 'src', 'index.ts');
const outDirPath = join(dirname(dirname(fileURLToPath(import.meta.url))), 'dist-docs');

export const typeDocConfig: Partial<TypeDocOptions> = {
    ...baseTypedocConfig,
    out: outDirPath,
    entryPoints: [
        indexTsFile.replaceAll('\\', '/'),
    ],
    intentionallyNotExported: [],
    defaultCategory: 'MISSING CATEGORY',
    categoryOrder: [
        'Main',
        'Shape',
        'Internal',
    ],
    highlightLanguages: [
        'yaml',

        // defaults
        'bash',
        'console',
        'css',
        'html',
        'javascript',
        'json',
        'jsonc',
        'json5',
        'tsx',
        'typescript',
    ],
};
