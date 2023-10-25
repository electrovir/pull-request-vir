import core from '@actions/core';
import github from '@actions/github';
import {extractErrorMessage} from '@augment-vir/common';
import {resolve} from 'path';

/** Stub for testing. */
export const testThing = {};

function main() {
    try {
        const configFilePath = resolve(core.getInput('config-file'));
        console.log(`got file path ${configFilePath}!`);

        core.setOutput('status', {stuff: true});
        // Get the JSON webhook payload for the event that triggered the workflow
        const payload = JSON.stringify(github.context.payload, undefined, 2);
        console.log(`The event payload: ${payload}`);
    } catch (error) {
        core.setFailed(extractErrorMessage(error));
    }
}

if (require.main === module) {
    main();
}
