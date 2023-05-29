export class TSocketError extends Error {

    constructor(opts: {
        message: string,
        code: number
    }) {
        const message = opts.message;
        const code = opts.code;

        // @ts-ignore
        super(message, { cause: code });
    }
}