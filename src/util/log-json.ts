import {AnyObject, log, logColors, type LogColorKey} from '@augment-vir/common';

export function logJson(json: AnyObject, logType: LogColorKey | `${LogColorKey}`) {
    log[logType](
        JSON.stringify(json, null, 4)
            .split('\n')
            .map((line) => `${logColors[logType]}    ${line}`)
            .join('\n') + '\n',
    );
}
