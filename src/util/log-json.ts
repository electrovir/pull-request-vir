import {AnyObject} from '@augment-vir/common';
import {log, logColors} from '@augment-vir/node-js';

export function logJson(json: AnyObject, logType: keyof typeof log) {
    log[logType](
        JSON.stringify(json, null, 4)
            .split('\n')
            .map((line) => `${logColors[logType]}    ${line}`)
            .join('\n') + '\n',
    );
}
