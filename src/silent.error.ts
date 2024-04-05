/** Throw this error if it shouldn't produce a log. */
export class SilentError extends Error {
    public override name = 'SilentError';
    constructor() {
        super();
    }
}
