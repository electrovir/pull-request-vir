import {log, logColors, type AnyObject, type LogColorKey} from '@augment-vir/common';

/**
 * Log an object as JSON that maintains its color through each line to fit GitHub Actions logs.
 *
 * @category Logging
 */
export function logJson(json: AnyObject, logType: LogColorKey | `${LogColorKey}`) {
    log[logType](
        JSON.stringify(json, null, 4)
            .split('\n')
            .map((line) => `${logColors[logType]}    ${line}`)
            .join('\n') + '\n',
    );
}
